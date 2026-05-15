"""
osm_ingest.py — Downloads emergency service POIs from OpenStreetMap Overpass API
and builds a SpatiaLite-compatible SQLite database for offline use.

Usage:
  python osm_ingest.py --region "Tamil Nadu" --bbox "8.0,76.5,13.5,80.5"
  python osm_ingest.py --city "Chennai" --radius 50000
"""
import sqlite3, requests, json, os, argparse, time
from datetime import datetime

OVERPASS_URL = "https://overpass-api.de/api/interpreter"

OSM_QUERIES = {
    "hospital":  'node["amenity"="hospital"]',
    "ambulance": 'node["emergency"="ambulance_station"]',
    "police":    'node["amenity"="police"]',
    "towing":    'node["shop"="car_repair"]',
    "puncture":  'node["shop"="tyres"]',
    "showroom":  'node["shop"="car"]',
}


def fetch_overpass(bbox: str, category: str, tag: str) -> list:
    """Fetch POIs from Overpass API for a given bounding box."""
    s, w, n, e = bbox.split(",")
    query = f"""[out:json][timeout:30];
({tag}({s},{w},{n},{e});
 way["{tag.split('[')[1].split(']')[0]}""]({s},{w},{n},{e}););
out center;"""
    try:
        resp = requests.get(OVERPASS_URL, params={"data": query}, timeout=35)
        resp.raise_for_status()
        return resp.json().get("elements", [])
    except Exception as e:
        print(f"  Overpass failed for {category}: {e}")
        return []


def parse_element(el: dict, category: str) -> dict | None:
    tags = el.get("tags", {})
    lat = el.get("lat") or el.get("center", {}).get("lat")
    lon = el.get("lon") or el.get("center", {}).get("lon")
    if not lat or not lon:
        return None

    name = tags.get("name") or tags.get("name:en") or category.title()
    phone = (tags.get("phone") or tags.get("contact:phone") or
             tags.get("contact:mobile") or tags.get("phone:mobile"))
    address = (tags.get("addr:full") or
               ", ".join(filter(None, [tags.get("addr:housenumber"),
                                        tags.get("addr:street"),
                                        tags.get("addr:city")])))

    return {
        "name": name, "category": category,
        "latitude": lat, "longitude": lon,
        "phone": phone, "address": address or None,
        "is_24x7": 1 if tags.get("opening_hours") == "24/7" else 0,
        "trauma_ready": 1 if (category == "hospital" and tags.get("emergency") == "yes") else 0,
        "osm_id": str(el.get("id")),
        "source": "osm",
        "confidence_score": 0.85,
        "last_verified_at": datetime.utcnow().isoformat(),
    }


def build_database(records: list, output_path: str):
    if os.path.exists(output_path):
        os.remove(output_path)
    conn = sqlite3.connect(output_path)

    conn.executescript("""
        CREATE TABLE services (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL, category TEXT NOT NULL,
            latitude REAL, longitude REAL,
            phone TEXT, address TEXT,
            is_24x7 INTEGER DEFAULT 0, trauma_ready INTEGER DEFAULT 0,
            icu_beds INTEGER DEFAULT 0, osm_id TEXT, source TEXT,
            confidence_score REAL DEFAULT 0.85,
            last_verified_at TEXT, created_at TEXT DEFAULT (datetime('now'))
        );
        CREATE INDEX idx_cat ON services(category);
        CREATE INDEX idx_lat ON services(latitude);
        CREATE INDEX idx_lon ON services(longitude);
    """)

    conn.executemany("""
        INSERT INTO services (name,category,latitude,longitude,phone,address,
                              is_24x7,trauma_ready,osm_id,source,confidence_score,last_verified_at)
        VALUES (:name,:category,:latitude,:longitude,:phone,:address,
                :is_24x7,:trauma_ready,:osm_id,:source,:confidence_score,:last_verified_at)
    """, records)
    conn.commit()
    conn.close()
    print(f"✅ Database: {output_path} ({os.path.getsize(output_path)//1024} KB, {len(records)} records)")


def main():
    parser = argparse.ArgumentParser(description="RoadSoS OSM Data Ingestion")
    parser.add_argument("--bbox",   default="8.0,76.5,13.5,80.5", help="south,west,north,east")
    parser.add_argument("--output", default="../database/india_tn_osm.sqlite")
    parser.add_argument("--categories", nargs="+", default=list(OSM_QUERIES.keys()))
    args = parser.parse_args()

    all_records = []
    for cat in args.categories:
        tag = OSM_QUERIES.get(cat)
        if not tag:
            continue
        print(f"Fetching {cat}...")
        elements = fetch_overpass(args.bbox, cat, tag)
        records = [r for el in elements if (r := parse_element(el, cat))]
        all_records.extend(records)
        print(f"  Found {len(records)} {cat} records")
        time.sleep(1)  # Rate limit Overpass API

    build_database(all_records, args.output)


if __name__ == "__main__":
    main()

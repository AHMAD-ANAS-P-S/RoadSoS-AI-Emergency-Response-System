"""
RoadSoS Services API — Emergency POI search (online + offline)
"""
from fastapi import APIRouter, Query
from pydantic import BaseModel
from typing import List, Optional
import httpx, math, sqlite3, os

router = APIRouter()

DB_PATH = os.path.join(os.path.dirname(__file__), "../../../database/india_tn.sqlite")

OSM_TAGS = {
    "hospital":  'node["amenity"="hospital"]',
    "ambulance": 'node["emergency"="ambulance_station"]',
    "police":    'node["amenity"="police"]',
    "towing":    'node["shop"="car_repair"]',
    "puncture":  'node["shop"="tyres"]',
    "showroom":  'node["shop"="car"]',
}

class ServiceResult(BaseModel):
    name: str
    phone: Optional[str]
    address: Optional[str]
    lat: Optional[float]
    lon: Optional[float]
    distance_m: Optional[float]
    is_24x7: bool = False
    trauma_ready: bool = False
    confidence_score: float = 0.85
    source: str = "osm"

@router.get("/nearest", response_model=List[ServiceResult])
async def get_nearest_services(
    category: str = Query(..., description="hospital|ambulance|police|towing|puncture|showroom"),
    lat: float = Query(...),
    lon: float = Query(...),
    radius: int = Query(default=5000, description="Search radius in metres"),
    limit: int = Query(default=5, le=10)
):
    """Fetch nearest emergency services. Tries Overpass API, falls back to local DB."""

    # 1. Try live Overpass API
    results = await query_overpass(category, lat, lon, radius, limit)

    # 2. Fall back to local SQLite if Overpass fails
    if not results:
        results = query_local_db(category, lat, lon, limit)

    return results

async def query_overpass(category, lat, lon, radius, limit) -> List[dict]:
    tag = OSM_TAGS.get(category)
    if not tag:
        return []
    query = f'[out:json][timeout:10];({tag}(around:{radius},{lat},{lon}););out {limit} center;'
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(
                "https://overpass-api.de/api/interpreter",
                params={"data": query}
            )
            resp.raise_for_status()
            data = resp.json()
    except Exception as e:
        print(f"Overpass failed ({category}): {e}")
        return []

    results = []
    for el in data.get("elements", [])[:limit]:
        el_lat = el.get("lat") or el.get("center", {}).get("lat")
        el_lon = el.get("lon") or el.get("center", {}).get("lon")
        dist = haversine(lat, lon, el_lat, el_lon) if el_lat and el_lon else None
        tags = el.get("tags", {})
        results.append(ServiceResult(
            name=tags.get("name") or tags.get("name:en") or category.title(),
            phone=tags.get("phone") or tags.get("contact:phone") or tags.get("contact:mobile"),
            address=tags.get("addr:full") or ", ".join(filter(None, [tags.get("addr:street"), tags.get("addr:city")])) or None,
            lat=el_lat, lon=el_lon, distance_m=dist,
            is_24x7=tags.get("opening_hours") == "24/7",
            trauma_ready=category == "hospital" and tags.get("emergency") == "yes",
            confidence_score=0.88, source="overpass"
        ))
    return sorted(results, key=lambda x: x.distance_m or 99999)

def query_local_db(category, lat, lon, limit) -> List[ServiceResult]:
    if not os.path.exists(DB_PATH):
        return []
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        R = 0.09  # ~10km in degrees
        rows = conn.execute("""
            SELECT name, phone, address, latitude, longitude,
                   is_24x7, trauma_ready, confidence_score,
                   (ABS(latitude-?) + ABS(longitude-?)) * 111195 AS dist_m
            FROM services WHERE category=?
              AND ABS(latitude-?) < ? AND ABS(longitude-?) < ?
            ORDER BY dist_m ASC LIMIT ?
        """, (lat, lon, category, lat, R, lon, R, limit)).fetchall()
        conn.close()
        return [ServiceResult(
            name=r["name"], phone=r["phone"], address=r["address"],
            lat=r["latitude"], lon=r["longitude"], distance_m=r["dist_m"],
            is_24x7=bool(r["is_24x7"]), trauma_ready=bool(r["trauma_ready"]),
            confidence_score=r["confidence_score"] or 0.75, source="local_db"
        ) for r in rows]
    except Exception as e:
        print(f"Local DB query failed: {e}")
        return []

def haversine(lat1, lon1, lat2, lon2) -> float:
    R = 6371000
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = math.sin(d_lat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(d_lon/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))

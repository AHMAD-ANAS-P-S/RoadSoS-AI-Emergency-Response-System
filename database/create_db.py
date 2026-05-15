"""
create_db.py — Creates the RoadSoS SQLite database with schema + seed data.
Run: python create_db.py
Output: database/india_tn.sqlite (deploy to frontend/public/data/)
"""
import sqlite3, os, shutil

BASE = os.path.dirname(os.path.abspath(__file__))
DB_OUT = os.path.join(BASE, "india_tn.sqlite")
SCHEMA = os.path.join(BASE, "schema.sql")
SEED   = os.path.join(BASE, "seed_data.sql")

def create_database():
    if os.path.exists(DB_OUT):
        os.remove(DB_OUT)
        print(f"Removed old DB: {DB_OUT}")

    conn = sqlite3.connect(DB_OUT)
    conn.row_factory = sqlite3.Row

    print("Creating schema...")
    with open(SCHEMA) as f:
        conn.executescript(f.read())

    print("Inserting seed data...")
    with open(SEED) as f:
        conn.executescript(f.read())

    conn.commit()

    # Verify
    cursor = conn.cursor()
    for cat in ['hospital','ambulance','police','towing','puncture','showroom']:
        count = cursor.execute("SELECT COUNT(*) FROM services WHERE category=?", (cat,)).fetchone()[0]
        print(f"  {cat}: {count} records")

    total = cursor.execute("SELECT COUNT(*) FROM services").fetchone()[0]
    print(f"\nTotal services: {total}")

    conn.close()
    print(f"\n✅ Database created: {DB_OUT}")
    print(f"   Size: {os.path.getsize(DB_OUT) / 1024:.1f} KB")

    # Copy to frontend public folder
    dest = os.path.join(BASE, "../frontend/public/data/india_tn.sqlite")
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    shutil.copy(DB_OUT, dest)
    print(f"   Copied to: {dest}")

if __name__ == "__main__":
    create_database()

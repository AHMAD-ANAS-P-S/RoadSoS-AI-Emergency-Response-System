import sqlite3
import aiofiles
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "../../../database/roadsos.db")

async def init_db():
    """Initialize SQLite database with schema."""
    schema_path = os.path.join(os.path.dirname(__file__), "../../../database/schema.sql")
    conn = sqlite3.connect(DB_PATH)
    try:
        if os.path.exists(schema_path):
            with open(schema_path) as f:
                conn.executescript(f.read())
        conn.commit()
        print("Database initialized")
    finally:
        conn.close()

def get_db():
    """Get a SQLite connection."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

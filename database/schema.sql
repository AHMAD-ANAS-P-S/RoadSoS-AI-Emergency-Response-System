-- RoadSoS Database Schema
-- Structured database for emergency services (as required by competition rules)
-- Compatible with SQLite + SpatiaLite

PRAGMA journal_mode=WAL;
PRAGMA foreign_keys=ON;

-- ─── EMERGENCY SERVICES ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS services (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    name             TEXT    NOT NULL,
    category         TEXT    NOT NULL CHECK(category IN ('hospital','ambulance','police','towing','puncture','showroom')),
    latitude         REAL    NOT NULL,
    longitude        REAL    NOT NULL,
    phone            TEXT,
    phone_alt        TEXT,
    address          TEXT,
    district         TEXT,
    state            TEXT    DEFAULT 'Tamil Nadu',
    country          TEXT    DEFAULT 'India',
    is_24x7          INTEGER DEFAULT 0,
    trauma_ready     INTEGER DEFAULT 0,
    icu_beds         INTEGER DEFAULT 0,
    osm_id           TEXT,
    source           TEXT    DEFAULT 'manual',  -- osm / govt / manual
    confidence_score REAL    DEFAULT 0.8,
    last_verified_at TEXT,
    created_at       TEXT    DEFAULT (datetime('now')),
    updated_at       TEXT    DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);
CREATE INDEX IF NOT EXISTS idx_services_lat      ON services(latitude);
CREATE INDEX IF NOT EXISTS idx_services_lon      ON services(longitude);
CREATE INDEX IF NOT EXISTS idx_services_district ON services(district);

-- ─── SOS EVENTS (analytics, anonymised) ─────────────────────
CREATE TABLE IF NOT EXISTS sos_events (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    session_hash    TEXT,
    timestamp       TEXT    DEFAULT (datetime('now')),
    latitude        REAL,
    longitude       REAL,
    severity        TEXT,
    intent          TEXT,
    selected_svc_id INTEGER REFERENCES services(id),
    network_status  TEXT    DEFAULT 'unknown',
    response_time_s REAL,
    triage_method   TEXT    DEFAULT 'keyword'
);

-- ─── LANGUAGE TEXTS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS i18n_strings (
    key  TEXT PRIMARY KEY,
    en   TEXT,
    hi   TEXT,
    ta   TEXT,
    te   TEXT,
    kn   TEXT,
    ml   TEXT,
    bn   TEXT,
    mr   TEXT,
    gu   TEXT,
    pa   TEXT
);

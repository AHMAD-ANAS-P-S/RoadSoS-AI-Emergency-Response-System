"""
test_roadsos.py — Pytest test suite for RoadSoS backend
Run: pytest tests/ -v
"""
import pytest, sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from ai_engine.nlp.intent_classifier import keyword_classify

# ─── AI TRIAGE TESTS ─────────────────────────────────────────
class TestKeywordClassifier:

    def test_critical_unconscious(self):
        r = keyword_classify("person is unconscious and not breathing")
        assert r["severity"] == "CRITICAL"
        assert r["priority_service"] in ["ambulance", "hospital"]

    def test_critical_bleeding(self):
        r = keyword_classify("bleeding heavily from head injury")
        assert r["severity"] == "CRITICAL"

    def test_moderate_accident(self):
        r = keyword_classify("bike accident, person injured but conscious")
        assert r["severity"] == "MODERATE"
        assert r["intent"] == "accident"

    def test_minor_breakdown(self):
        r = keyword_classify("flat tyre on highway, everyone ok")
        assert r["severity"] == "MINOR"
        assert r["intent"] == "breakdown"

    def test_harassment_intent(self):
        r = keyword_classify("robbery at petrol pump, need police")
        assert r["intent"] == "harassment"
        assert r["priority_service"] == "police"

    def test_returns_first_aid(self):
        r = keyword_classify("accident")
        assert "first_aid" in r
        assert len(r["first_aid"]) >= 3

    def test_confidence_score(self):
        r = keyword_classify("accident")
        assert 0 <= r["confidence"] <= 1.0

    def test_all_fields_present(self):
        r = keyword_classify("car crash injured")
        for field in ["severity", "intent", "confidence", "method", "first_aid", "priority_service"]:
            assert field in r, f"Missing field: {field}"


# ─── DATABASE TESTS ──────────────────────────────────────────
class TestDatabase:

    def test_db_exists(self):
        db_path = os.path.join(os.path.dirname(__file__), '../database/india_tn.sqlite')
        assert os.path.exists(db_path), "Database file not found. Run: python database/create_db.py"

    def test_db_has_hospitals(self):
        import sqlite3
        db_path = os.path.join(os.path.dirname(__file__), '../database/india_tn.sqlite')
        if not os.path.exists(db_path):
            pytest.skip("Database not created yet")
        conn = sqlite3.connect(db_path)
        count = conn.execute("SELECT COUNT(*) FROM services WHERE category='hospital'").fetchone()[0]
        conn.close()
        assert count >= 5

    def test_db_schema_correct(self):
        import sqlite3
        db_path = os.path.join(os.path.dirname(__file__), '../database/india_tn.sqlite')
        if not os.path.exists(db_path):
            pytest.skip("Database not created yet")
        conn = sqlite3.connect(db_path)
        cols = [r[1] for r in conn.execute("PRAGMA table_info(services)").fetchall()]
        conn.close()
        required = ["name", "category", "latitude", "longitude", "phone"]
        for col in required:
            assert col in cols, f"Missing column: {col}"

    def test_all_categories_present(self):
        import sqlite3
        db_path = os.path.join(os.path.dirname(__file__), '../database/india_tn.sqlite')
        if not os.path.exists(db_path):
            pytest.skip("Database not created yet")
        conn = sqlite3.connect(db_path)
        cats = [r[0] for r in conn.execute("SELECT DISTINCT category FROM services").fetchall()]
        conn.close()
        for cat in ['hospital', 'ambulance', 'police', 'towing', 'puncture']:
            assert cat in cats, f"Category missing: {cat}"

    def test_spatial_query(self):
        """Test that nearest services can be found near Chennai."""
        import sqlite3
        db_path = os.path.join(os.path.dirname(__file__), '../database/india_tn.sqlite')
        if not os.path.exists(db_path):
            pytest.skip("Database not created yet")
        conn = sqlite3.connect(db_path)
        lat, lon = 13.0827, 80.2707  # Chennai center
        R = 0.5  # ~55km in degrees
        results = conn.execute("""
            SELECT name, latitude, longitude,
                   (ABS(latitude-?) + ABS(longitude-?)) * 111195 AS dist_m
            FROM services WHERE category='hospital'
              AND ABS(latitude-?) < ? AND ABS(longitude-?) < ?
            ORDER BY dist_m LIMIT 5
        """, (lat, lon, lat, R, lon, R)).fetchall()
        conn.close()
        assert len(results) >= 1, "No hospitals found near Chennai"
        # Nearest should be within 30km
        assert results[0][3] < 30000, f"Nearest hospital too far: {results[0][3]}m"

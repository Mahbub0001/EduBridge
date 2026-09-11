import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from app.main import app
from app.core.cache import cache, invalidate_cache

def run_tests():
    client = TestClient(app)
    print("=" * 60)
    print("RUNNING EDUBRIDGE BACKEND SANITY & CACHE TEST SUITE")
    print("=" * 60)

    # 1. Health & Root Check
    print("\n[1] Testing Root & Health Endpoints...")
    r = client.get("/")
    assert r.status_code == 200, f"Root failed: {r.status_code}"
    print(" -> Root / OK:", r.json().get("message"))

    r = client.get("/health")
    assert r.status_code == 200, f"Health failed: {r.status_code}"
    print(" -> Health /health OK:", r.json().get("message"))

    # 2. Public Courses Caching & ETag Test
    print("\n[2] Testing Courses Endpoint Caching & ETags...")
    invalidate_cache(["edubridge:courses*"])

    # First request: Cache MISS
    t0 = time.perf_counter()
    r1 = client.get("/api/courses/")
    t1 = time.perf_counter()
    duration_miss = (t1 - t0) * 1000
    assert r1.status_code == 200
    assert r1.headers.get("X-Cache") == "MISS", f"Expected MISS, got {r1.headers.get('X-Cache')}"
    etag = r1.headers.get("ETag")
    assert etag is not None, "Missing ETag header"
    print(f" -> First Request (MISS): {duration_miss:.2f}ms | ETag: {etag}")

    # Second request: Cache HIT (Sub-millisecond / lightning-fast)
    t0 = time.perf_counter()
    r2 = client.get("/api/courses/")
    t1 = time.perf_counter()
    duration_hit = (t1 - t0) * 1000
    assert r2.status_code == 200
    assert r2.headers.get("X-Cache") == "HIT", f"Expected HIT, got {r2.headers.get('X-Cache')}"
    print(f" -> Second Request (HIT):  {duration_hit:.2f}ms (Speedup: {duration_miss / max(duration_hit, 0.01):.1f}x)")

    # Third request with If-None-Match: 304 Not Modified
    r3 = client.get("/api/courses/", headers={"If-None-Match": etag})
    assert r3.status_code == 304, f"Expected 304, got {r3.status_code}"
    assert r3.headers.get("X-Cache") == "HIT-304"
    print(" -> Conditional Request with ETag (304 Not Modified): OK")

    # 5. Calendar Endpoints & Custom Events Evaluation Test
    print("\n[5] Testing Academic Calendar & Custom Study Tasks...")
    # Clean cache
    invalidate_cache(["edubridge:calendar*"])

    # Simulate calendar events with test auth user dependency override
    from app.core.dependencies import get_current_user
    mock_student = {
        "id": "test-student-cal",
        "email": "student@example.com",
        "role": "student",
        "name": "Test Student"
    }
    app.dependency_overrides[get_current_user] = lambda: mock_student

    # Create a custom study event
    event_payload = {
        "title": "Study Group: Advanced Machine Learning",
        "date": "2026-08-25",
        "time": "04:00 PM",
        "duration_mins": 90,
        "type": "study",
        "description": "Prepare notes for neural networks quiz",
        "priority": "high"
    }
    r_create = client.post("/api/calendar/events", json=event_payload)
    assert r_create.status_code == 200, f"Failed to create event: {r_create.text}"
    created_event = r_create.json()["data"]
    event_id = created_event["id"]
    print(f" -> Created Custom Study Event ID: {event_id} (Status: {r_create.status_code})")

    # Fetch Calendar & Verify Event Aggregation
    r_cal = client.get("/api/me/calendar")
    assert r_cal.status_code == 200
    cal_events = r_cal.json()["data"]
    matched = [e for e in cal_events if e.get("id") == event_id or e.get("raw_id") == event_id]
    assert len(matched) > 0, "Created event not found in aggregated calendar"
    print(f" -> Aggregated Calendar retrieved {len(cal_events)} total milestones (Custom event found: OK)")

    # Toggle Completion
    r_toggle = client.patch(f"/api/calendar/events/{event_id}/toggle")
    assert r_toggle.status_code == 200
    assert r_toggle.json()["data"]["completed"] is True
    print(" -> Toggled event completion status to Completed (OK)")

    # Delete Event
    r_del = client.delete(f"/api/calendar/events/{event_id}")
    assert r_del.status_code == 200
    print(" -> Deleted Custom Event: OK")

    # Clear dependency override
    app.dependency_overrides.clear()

    print("\n" + "=" * 60)
    print("ALL SANITY, CACHING & CALENDAR TESTS PASSED (100% SUCCESS)")
    print("=" * 60)

if __name__ == "__main__":
    run_tests()

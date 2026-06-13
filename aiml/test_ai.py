import time
from fastapi.testclient import TestClient
from main_ai import app

client = TestClient(app)

def test_leak_check():
    response = client.post("/leak/check", json={
        "fragment_hashes": [
            "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855", # Bad
            "abcdef1234567890", # Good
            "deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef" # Bad
        ]
    })
    assert response.status_code == 200
    data = response.json()
    assert data["leak_probability"] == round(2/3, 4)
    assert len(data["compromised_hashes"]) == 2
    assert data["latency_seconds"] < 3.0

def test_fingerprint_verify_match():
    # User 0 mean is 100ms
    response = client.post("/fingerprint/verify", json={
        "user_id": 0,
        "dwell_times": [101.5, 98.2, 105.0, 99.1, 100.0, 102.3, 97.4, 103.1, 99.9, 101.0]
    })
    assert response.status_code == 200
    assert response.json()["is_match"] == True

def test_fingerprint_verify_mismatch():
    # User 2 mean is 80ms, but claiming to be User 0
    response = client.post("/fingerprint/verify", json={
        "user_id": 0,
        "dwell_times": [81.5, 78.2, 85.0, 79.1, 80.0, 82.3, 77.4, 83.1, 79.9, 81.0]
    })
    assert response.status_code == 200
    data = response.json()
    assert data["is_match"] == False
    assert data["predicted_user"] != 0

def test_shard_distribution():
    questions = [
        "A short question?",
        "This is a slightly longer medium question.",
        "This is an extremely long and convoluted question that should be classified as very hard because it has a high word count and character length.",
        "Another small one.",
        "Medium difficulty query text here."
    ]
    response = client.post("/shard/distribute", json={"questions": questions})
    assert response.status_code == 200
    data = response.json()["shard_distribution"]
    
    assert len(data) == 5
    # The longest question should be in the highest tier among the returned set
    longest_q = max(data, key=lambda x: x["difficulty_tier"])
    assert "extremely long" in longest_q["question"]
    assert longest_q["recommended_n"] > 10

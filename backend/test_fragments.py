import time
# pyrefly: ignore [missing-import]
import pytest
# pyrefly: ignore [missing-import]
from fastapi.testclient import TestClient
from main import app, DB_FRAGMENTS, DB_QUESTIONS

client = TestClient(app)

@pytest.fixture(autouse=True)
def clear_db():
    DB_FRAGMENTS.clear()
    DB_QUESTIONS.clear()
    yield

def test_generate_and_assemble_success():
    # 1. Generate fragments for 10 questions
    questions = [f"This is test question number {i}" for i in range(10)]
    
    # Set T0 to the past to allow immediate decryption
    t0 = time.time() - 100 
    
    response = client.post("/fragment/generate", json={
        "questions": questions,
        "n": 50,
        "k": 30,
        "t0": t0
    })
    
    assert response.status_code == 200
    data = response.json()
    q_fragments = data["question_fragments"]
    assert len(q_fragments) == 10
    
    # 2. Assemble using exactly k fragments
    q_id = list(q_fragments.keys())[0]
    frag_ids = q_fragments[q_id]
    assert len(frag_ids) == 50
    
    # Pick k=30 fragments
    k_frags = frag_ids[:30]
    
    assemble_resp = client.post("/fragment/assemble", json={
        "question_id": q_id,
        "fragment_ids": k_frags
    })
    
    assert assemble_resp.status_code == 200
    assert assemble_resp.json()["question_text"] == questions[0]

def test_assemble_with_insufficient_fragments():
    # Set T0 to the past
    t0 = time.time() - 100 
    response = client.post("/fragment/generate", json={
        "questions": ["Secret Question"],
        "n": 5,
        "k": 3,
        "t0": t0
    })
    q_fragments = response.json()["question_fragments"]
    q_id = list(q_fragments.keys())[0]
    frag_ids = q_fragments[q_id]
    
    # Pick < k fragments (2 fragments)
    bad_frags = frag_ids[:2]
    
    assemble_resp = client.post("/fragment/assemble", json={
        "question_id": q_id,
        "fragment_ids": bad_frags
    })
    
    # It should fail with an exception due to incorrect AES key derived from insufficient shares
    assert assemble_resp.status_code == 400
    assert "Failed to assemble fragments" in assemble_resp.json()["detail"]

def test_time_lock_encryption():
    # Set T0 to the future
    t0 = time.time() + 1000 
    response = client.post("/fragment/generate", json={
        "questions": ["Future Question"],
        "n": 5,
        "k": 3,
        "t0": t0
    })
    q_fragments = response.json()["question_fragments"]
    q_id = list(q_fragments.keys())[0]
    frag_ids = q_fragments[q_id]
    
    k_frags = frag_ids[:3]
    
    assemble_resp = client.post("/fragment/assemble", json={
        "question_id": q_id,
        "fragment_ids": k_frags
    })
    
    assert assemble_resp.status_code == 403
    assert "Time-Lock active" in assemble_resp.json()["detail"]

def test_regenerate_fragment():
    # Generate
    response = client.post("/fragment/generate", json={
        "questions": ["Regen Question"],
        "n": 5,
        "k": 3,
        "t0": time.time() - 10
    })
    q_fragments = response.json()["question_fragments"]
    q_id = list(q_fragments.keys())[0]
    frag_ids = q_fragments[q_id]
    
    compromised_frag = frag_ids[0]
    
    # Regenerate
    regen_resp = client.post("/fragment/regenerate", json={
        "question_id": q_id,
        "compromised_fragment_id": compromised_frag
    })
    
    assert regen_resp.status_code == 200
    new_frag = regen_resp.json()["new_fragment_id"]
    
    # Verify compromised is gone and new is present
    assert compromised_frag not in DB_FRAGMENTS
    assert new_frag in DB_FRAGMENTS
    
    # Assemble with new frag
    good_frags = [new_frag, frag_ids[1], frag_ids[2]]
    assemble_resp = client.post("/fragment/assemble", json={
        "question_id": q_id,
        "fragment_ids": good_frags
    })
    
    assert assemble_resp.status_code == 200
    assert assemble_resp.json()["question_text"] == "Regen Question"

def test_bulk_generation_performance():
    """Testing requirement: 100 questions, 5000 fragments (n=50, k=30)."""
    questions = [f"Q{i}" for i in range(100)]
    t0 = time.time() - 100
    
    start_time = time.time()
    response = client.post("/fragment/generate", json={
        "questions": questions,
        "n": 50,
        "k": 30,
        "t0": t0
    })
    end_time = time.time()
    
    assert response.status_code == 200
    assert len(DB_FRAGMENTS) == 5000
    assert len(DB_QUESTIONS) == 100
    print(f"Time taken for 100 questions (5000 fragments): {end_time - start_time:.2f} seconds")

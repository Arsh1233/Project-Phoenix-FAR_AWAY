# Project PHOENIX - Core Fragment Engine

This is the Core Fragment Engine backend service for Project PHOENIX. It handles the splitting of examination questions into encrypted shards using Shamir's Secret Sharing (SSS) and Time-Lock Encryption (TLE).

## Features
- **Shamir's Secret Sharing**: Splits a 256-bit AES encryption key into `n` fragments using a 521-bit prime field, requiring `k` fragments to assemble.
- **Time-Lock Encryption**: Fragments can only be decrypted when the server time has surpassed a predefined UNIX timestamp `T0`.
- **Healing / Regeneration**: Allows for a compromised fragment ID to be invalidated and replaced with a newly generated valid share without requiring full re-encryption.
- **Async Endpoints**: FastAPI provides non-blocking, fast processing capable of handling 5000 fragments dynamically.

## Installation

1. Create a virtual environment and install the required packages:
```bash
pip install -r requirements.txt
```

2. Start the server:
```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

## API Examples

### 1. Generate Fragments
Splits a list of questions into `n` fragments where `k` fragments are needed to recover them. The questions will be locked until `t0`.

```bash
curl -X POST "http://localhost:8000/fragment/generate" \
     -H "Content-Type: application/json" \
     -d '{
           "questions": ["What is the capital of France?", "What is 2+2?"],
           "n": 50,
           "k": 30,
           "t0": 1780000000.0
         }'
```

### 2. Assemble Fragments
Given a `question_id` and an array of `k` `fragment_ids`, reconstruct the question text (only succeeds if current time >= `t0`).

```bash
curl -X POST "http://localhost:8000/fragment/assemble" \
     -H "Content-Type: application/json" \
     -d '{
           "question_id": "abc-123-...",
           "fragment_ids": ["frag-id-1", "frag-id-2", "..."]
         }'
```

### 3. Regenerate Compromised Fragment
Invalidates a known compromised fragment and yields a new one for healing.

```bash
curl -X POST "http://localhost:8000/fragment/regenerate" \
     -H "Content-Type: application/json" \
     -d '{
           "question_id": "abc-123-...",
           "compromised_fragment_id": "frag-id-1"
         }'
```

### 4. Health Check
```bash
curl -X GET "http://localhost:8000/health"
```

## Testing
Unit tests are included. To run tests:
```bash
pytest test_fragments.py
```

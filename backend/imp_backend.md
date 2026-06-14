You are a backend & cryptography expert. Build the core fragment engine for Project PHOENIX.

Objective:
Create a Python/FastAPI service that:
1. Takes a JSON array of questions (exam paper).
2. Splits each question into N encrypted fragments using Shamir's Secret Sharing (k-of-n threshold).
3. Implements time-lock encryption (TLE) so fragments can only be decrypted after a given UNIX timestamp.
4. Stores fragments in a distributed hash table (in-memory for demo, but interface for Redis/S3).
5. Provides endpoints: /fragment/generate, /fragment/assemble, /fragment/regenerate (for healing).

Tech Stack:
- Python 3.11+
- FastAPI
- shamir‑secret‑sharing library (or implement GF(2^8) manually)
- time-lock: use "timelock" or construct via RSA + repeated squaring (or use a simple AES + delayed key release for demo)
- pydantic for validation

Deliverables (files to output):
- main.py (FastAPI app)
- crypto_engine.py (Shamir + TLE)
- test_fragments.py (unit tests with 10 questions)
- requirements.txt
- README.md with API examples

Acceptance Criteria:
- Given 100 questions, generate 5000 fragments (50 per question) with threshold k=30.
- Time-locked fragment cannot be decrypted before T0.
- Assembling any k fragments recovers original question text.
- Regenerate endpoint: replace a compromised fragment ID with a new valid one.

Vibe Coding Tips:
- Use async endpoints.
- Add a /health endpoint.
- Keep fragments as base64 strings for easy transport.
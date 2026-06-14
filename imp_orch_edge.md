You are an Edge Agent & Integration Engineer. Build the local assembler and end-to-end orchestration for Project PHOENIX.

Objective:
Create two things:

A) **Edge Agent Service** (Python Flask) that:
   - Runs on a simulated "exam center" machine (or Raspberry Pi).
   - Caches fragments from the crypto service (in Redis or simple dict).
   - Assembles a complete question paper per candidate (by calling /fragment/assemble on the crypto service) with sub-10ms latency.
   - Provides REST endpoints: /exam/start (creates a session), /exam/next (returns next question as plain text).
   - Listens to the Leak Detector (via WebSocket or HTTP callback) and triggers fragment regeneration locally.

B) **Integration & Orchestration**:
   - Write a docker-compose.yml that runs: Crypto Service, AI Service, Blockchain (mock), Frontend (served via Nginx or Vite preview), Edge Agent.
   - Write a demo script (bash or Python) that simulates a NEET-style leak:
        * Step 1: Start exam for a candidate.
        * Step 2: Inject a leaked fragment hash into the leak detector.
        * Step 3: Show that the Edge Agent receives a regeneration event.
        * Step 4: Candidate continues exam without interruption.
   - Write a simple load test (Locust) to prove sub-10ms assembly for 100 concurrent candidates.

Tech Stack:
- Python 3.11+ (Flask for Edge Agent)
- Redis (or simple in-memory cache with TTL)
- Docker & Docker Compose
- Locust (optional but recommended)
- Bash or Python for demo script

Deliverables:
- edge-agent/ (app.py, cache.py, regeneration_handler.py, requirements.txt)
- docker-compose.yml (all 5 services, network, volumes)
- demo/leak_simulation.sh (or .py)
- demo/load_test.py (Locust file)
- README.md (one-command start: `docker-compose up --build`)

Acceptance Criteria:
- `docker-compose up --build` starts everything; frontend accessible at localhost:3000.
- Edge Agent assembly latency < 10ms (measured via /exam/next endpoint).
- Leak simulation script outputs:
   "[LEAK] Detected hash f8e7... -> Regenerating fragments -> Done. Exam continues."
- All services log to console for easy debugging.

Vibe Coding Tips:
- For caching, use `functools.lru_cache` with timeout or a simple dict + timestamps.
- Make the demo script call the actual /leak/check endpoint with a test fragment hash.
- Ensure the Edge Agent gracefully handles regeneration – if a fragment is blacklisted, it re-requests from crypto service.
- Add a `reset.sh` to clear caches and mock blockchain.
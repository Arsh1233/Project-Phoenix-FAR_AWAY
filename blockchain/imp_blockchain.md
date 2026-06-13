You are a blockchain engineer. Build the audit trail for Project PHOENIX.

Objective:
Set up a Hyperledger Fabric network (or use a mock blockchain for demo) that:
1. Records every fragment access event (candidate ID, fragment ID, timestamp, center ID).
2. Emits an alert if the same fragment is requested from two different locations within 5 seconds (possible leak).
3. Provides a REST API (via Fabric Gateway) to query logs and verify integrity.
4. (Optional) Implements a simple ZK-SNARK to prove a fragment is valid without revealing content.

Tech Stack:
- Hyperledger Fabric 2.5 (or use a mock blockchain via Python's hashlib + chain simulation)
- Fabric Gateway SDK for Python
- Docker Compose for network setup
- For mock: just a JSON log with cryptographic chaining (each block contains hash of previous)

Deliverables:
- network/ (docker-compose + configtx.yaml)
- chaincode/fragment_audit.go (or TypeScript)
- api/gateway.py (FastAPI to submit and query transactions)
- mock_chain.py (if using mock, provide fallback)
- README with setup commands

Acceptance Criteria:
- Submitting a fragment access creates an immutable record.
- Duplicate access from different IPs within 5 seconds triggers a console alert.
- Logs can be verified (hash chain intact).
- Demo shows 5 access events and a simulated conflict.

Vibe Coding Tips:
- Use the mock blockchain for portability – judges don't need full Fabric setup.
- Ensure the mock still has "block hash + previous hash" structure.
- Add a /logs/verify endpoint that recomputes hashes.
# Project Phoenix: Fragment Audit Trail

This repository contains the backend implementation for the Project Phoenix audit trail. It uses a mock blockchain implementation to ensure portability for demos while fulfilling all cryptographic and auditing requirements.

## Features

1. **Immutable Records**: Fragment access events are stored in a simulated blockchain with cryptographic hashing.
2. **Leak Detection**: Emits a console alert if the same fragment is requested from two different locations within 5 seconds.
3. **REST API**: Provides endpoints to submit access events, view logs, and verify blockchain integrity.
4. **Demo Script**: A ready-to-run simulation that demonstrates normal accesses, a simulated conflict, and log verification.

## Prerequisites

- Python 3.8+
- `fastapi`
- `uvicorn`
- `requests`

## Setup

1. Install dependencies:
   ```bash
   pip install fastapi uvicorn requests pydantic
   ```

2. Start the API Server:
   From the `backend` directory, run:
   ```bash
   # Run the gateway API
   python api/gateway.py
   ```
   Or using uvicorn directly:
   ```bash
   uvicorn api.gateway:app --host 0.0.0.0 --port 8000
   ```

3. Run the Demo:
   In a separate terminal, run the demo script to simulate traffic:
   ```bash
   python demo.py
   ```

## Endpoints

- `POST /access`: Submits a new fragment access event.
  - Body: `{"candidate_id": "...", "fragment_id": "...", "center_id": "..."}`
- `GET /logs`: Retrieves the full blockchain log.
- `GET /logs/verify`: Recomputes hashes and verifies the integrity of the chain.

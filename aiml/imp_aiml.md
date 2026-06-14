You are an AI/ML engineer. Build the intelligence layer for Project PHOENIX.

Objective:
Create a Python service that:
1. Simulates a dark web / Telegram scraper that checks for fragment hashes (SHA256) in leaked datasets.
2. Uses a simple ML classifier (RandomForest or a small neural net) to detect anomalous typing patterns (behavioral fingerprinting).
3. Implements a "question sharding AI" that decides optimal fragment distribution based on question difficulty and candidate profile (rule-based + clustering for demo).
4. Exposes a FastAPI endpoint /leak/check that returns leak probability and blacklist suggestions.
5. Exposes /fingerprint/register and /fingerprint/verify.

Tech Stack:
- Python 3.11+
- FastAPI
- scikit-learn (RandomForest)
- sentence-transformers (for question similarity, optional)
- playwright or requests for scraping simulation
- numpy/pandas

Deliverables:
- leak_detector.py (scraper + hash matcher)
- fingerprint_model.pkl (trained on synthetic keystroke data)
- shard_ai.py (clustering for fragment distribution)
- main_ai.py (FastAPI with three routers)
- demo_data/ (synthetic candidate logs)

Acceptance Criteria:
- Scraper detects when a fragment hash appears in a mocked "leaked_hashes.txt".
- Leak detection latency < 3 seconds from API call.
- Fingerprint model: 95% accuracy on distinguishing 5 synthetic users.
- Shard AI: groups questions into 5 difficulty tiers and distributes fragments accordingly.

Vibe Coding Tips:
- Generate synthetic keystroke data using random delays (mean 100ms, std 20ms).
- For dark web simulation, just poll a local JSON file – judges understand demo constraints.
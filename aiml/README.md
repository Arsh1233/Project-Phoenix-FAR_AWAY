# Project PHOENIX - AI/ML Intelligence Layer

This module provides the intelligence capabilities for Project PHOENIX, focusing on proactive threat detection and dynamic data distribution.

## Features
- **Leak Detection**: Intersects fragment hashes with known dark web datasets (simulated via local JSON) to compute compromise probability in <3s latency.
- **Behavioral Fingerprinting**: Uses an ML model (`RandomForestClassifier`) trained on synthetic keystroke dynamics to classify users and verify identity to prevent credential sharing.
- **Question Sharding AI**: Uses KMeans clustering to categorize examination questions into 5 difficulty tiers based on text features. Harder questions automatically receive a wider fragment distribution (higher `n` and `k` thresholds).

## Setup
1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Train the Fingerprinting Model (optional, pre-trained model `fingerprint_model.pkl` is provided):
```bash
python fingerprint_trainer.py
```

3. Run the FastAPI Service:
```bash
uvicorn main_ai:app --host 0.0.0.0 --port 8001
```

## API Usage

### 1. Leak Check
```bash
curl -X POST "http://localhost:8001/leak/check" \
     -H "Content-Type: application/json" \
     -d '{
           "fragment_hashes": ["e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"]
         }'
```

### 2. Fingerprint Verify
```bash
curl -X POST "http://localhost:8001/fingerprint/verify" \
     -H "Content-Type: application/json" \
     -d '{
           "user_id": 0,
           "dwell_times": [101.5, 98.2, 105.0, 99.1, 100.0, 102.3, 97.4, 103.1, 99.9, 101.0]
         }'
```

### 3. Shard Distribution (AI Clustering)
```bash
curl -X POST "http://localhost:8001/shard/distribute" \
     -H "Content-Type: application/json" \
     -d '{
           "questions": ["A short, easy question?", "An extremely long, complex and difficult question requiring deep thought."]
         }'
```

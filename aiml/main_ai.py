from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
import pickle

from leak_detector import LeakDetector
from shard_ai import ShardAI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Project PHOENIX Intelligence Layer")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize modules
leak_detector = LeakDetector()
shard_ai = ShardAI()

try:
    with open("fingerprint_model.pkl", "rb") as f:
        fingerprint_model = pickle.load(f)
except FileNotFoundError:
    fingerprint_model = None
    print("Warning: fingerprint_model.pkl not found. Run fingerprint_trainer.py first.")

# --- Models ---

class LeakCheckRequest(BaseModel):
    fragment_hashes: List[str]

class FingerprintRequest(BaseModel):
    user_id: int
    dwell_times: List[float]

class ShardRequest(BaseModel):
    questions: List[str]

# --- Endpoints ---

@app.post("/leak/check")
async def check_leak(req: LeakCheckRequest):
    result = leak_detector.check_hashes(req.fragment_hashes)
    return result

@app.post("/fingerprint/register")
async def register_fingerprint(req: FingerprintRequest):
    # In a real system, this would append data and retrain online
    return {"message": f"User {req.user_id} keystroke dynamics registered."}

@app.post("/fingerprint/verify")
async def verify_fingerprint(req: FingerprintRequest):
    if not fingerprint_model:
        raise HTTPException(status_code=500, detail="Fingerprint model not loaded.")
        
    if len(req.dwell_times) != 10:
        raise HTTPException(status_code=400, detail="Expected exactly 10 dwell times.")
        
    # Predict user
    predicted_user = fingerprint_model.predict([req.dwell_times])[0]
    
    match = int(predicted_user) == req.user_id
    
    return {
        "claimed_user": req.user_id,
        "predicted_user": int(predicted_user),
        "is_match": match
    }

@app.post("/shard/distribute")
async def distribute_shards(req: ShardRequest):
    if not req.questions:
        raise HTTPException(status_code=400, detail="No questions provided.")
        
    shards = shard_ai.determine_shards(req.questions)
    return {"shard_distribution": shards}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)

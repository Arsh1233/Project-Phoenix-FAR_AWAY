import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
import time
from mock_chain import Blockchain
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Project Phoenix - Fragment Audit Trail")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Instantiate the Blockchain
blockchain = Blockchain()

class AccessEvent(BaseModel):
    candidate_id: str
    fragment_id: str
    center_id: str
    timestamp: Optional[float] = None

@app.post("/access")
def record_access(event: AccessEvent):
    """
    Record a fragment access event.
    """
    if event.timestamp is None:
        event.timestamp = time.time()
        
    block = blockchain.new_transaction(
        candidate_id=event.candidate_id,
        fragment_id=event.fragment_id,
        center_id=event.center_id,
        timestamp=event.timestamp
    )
    
    return {
        "message": "Access recorded successfully",
        "block_index": block['index'],
        "timestamp": event.timestamp
    }

@app.get("/logs")
def get_logs():
    """
    Retrieve the full blockchain log.
    """
    return {
        "chain": blockchain.chain,
        "length": len(blockchain.chain),
    }

@app.get("/logs/verify")
def verify_logs():
    """
    Verify the integrity of the blockchain logs.
    """
    is_valid = blockchain.verify_chain()
    if is_valid:
        return {"status": "success", "message": "Blockchain integrity verified. All hashes match."}
    else:
        raise HTTPException(status_code=400, detail="Blockchain integrity compromised!")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

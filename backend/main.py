# pyrefly: ignore [missing-import]
from fastapi import FastAPI, HTTPException, Body
from pydantic import BaseModel
import time
import base64
import uuid
import secrets
from typing import List, Dict, Any

from crypto_engine import split_secret, recover_secret, encrypt_data, decrypt_data, _eval_at, PRIME
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Project PHOENIX Core Fragment Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mock In-Memory Databases
DB_FRAGMENTS: Dict[str, Dict[str, Any]] = {}
DB_QUESTIONS: Dict[str, Dict[str, Any]] = {}

class GenerateRequest(BaseModel):
    questions: List[str]
    n: int
    k: int
    t0: float  # Unix timestamp

class AssembleRequest(BaseModel):
    question_id: str
    fragment_ids: List[str]

class RegenerateRequest(BaseModel):
    question_id: str
    compromised_fragment_id: str

@app.post("/fragment/generate")
async def generate_fragments(req: GenerateRequest):
    if req.k > req.n:
        raise HTTPException(status_code=400, detail="k cannot be greater than n")
    
    result = {"question_fragments": {}}
    
    for q_text in req.questions:
        q_id = str(uuid.uuid4())
        
        # 1. Encrypt the question text with a random AES key
        data = q_text.encode('utf-8')
        aes_key, nonce, ciphertext = encrypt_data(data)
        
        # 2. Split the AES key into SSS fragments
        secret_int = int.from_bytes(aes_key, 'big')
        poly = [secret_int] + [secrets.randbelow(PRIME) for _ in range(req.k - 1)]
        
        # Store question metadata (nonce, ciphertext, t0, and poly for regeneration)
        DB_QUESTIONS[q_id] = {
            "nonce": base64.b64encode(nonce).decode('utf-8'),
            "ciphertext": base64.b64encode(ciphertext).decode('utf-8'),
            "t0": req.t0,
            "poly": poly,
            "n_count": req.n # keep track of how many x values we've used
        }
        
        frag_ids = []
        for i in range(1, req.n + 1):
            x = i
            y = _eval_at(poly, x, PRIME)
            frag_id = str(uuid.uuid4())
            DB_FRAGMENTS[frag_id] = {
                "question_id": q_id,
                "x": x,
                "y": str(y) # string to handle huge ints
            }
            frag_ids.append(frag_id)
            
        result["question_fragments"][q_id] = frag_ids
        
    return result

@app.post("/fragment/assemble")
async def assemble_fragments(req: AssembleRequest):
    q_metadata = DB_QUESTIONS.get(req.question_id)
    if not q_metadata:
        raise HTTPException(status_code=404, detail="Question not found")
        
    # Time-Lock Check
    if time.time() < q_metadata["t0"]:
        raise HTTPException(
            status_code=403, 
            detail=f"Time-Lock active. Fragments cannot be decrypted before {q_metadata['t0']}"
        )
        
    shares = []
    for f_id in req.fragment_ids:
        frag = DB_FRAGMENTS.get(f_id)
        if not frag or frag["question_id"] != req.question_id:
            raise HTTPException(status_code=400, detail=f"Invalid fragment ID: {f_id}")
        shares.append((frag["x"], int(frag["y"])))
        
    try:
        # Recover AES key
        secret_int = recover_secret(shares)
        aes_key = secret_int.to_bytes(32, 'big')
        
        # Decrypt question
        nonce = base64.b64decode(q_metadata["nonce"])
        ciphertext = base64.b64decode(q_metadata["ciphertext"])
        question_text = decrypt_data(aes_key, nonce, ciphertext).decode('utf-8')
        
        return {"question_text": question_text}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to assemble fragments: {str(e)}")

@app.post("/fragment/regenerate")
async def regenerate_fragment(req: RegenerateRequest):
    """
    Invalidates a compromised fragment ID and generates a new valid share.
    """
    q_metadata = DB_QUESTIONS.get(req.question_id)
    if not q_metadata:
        raise HTTPException(status_code=404, detail="Question not found")
        
    frag = DB_FRAGMENTS.get(req.compromised_fragment_id)
    if not frag or frag["question_id"] != req.question_id:
        raise HTTPException(status_code=400, detail="Invalid compromised fragment ID")
        
    # Remove the compromised fragment
    del DB_FRAGMENTS[req.compromised_fragment_id]
    
    # Generate a new share using a new x-coordinate
    q_metadata["n_count"] += 1
    new_x = q_metadata["n_count"]
    new_y = _eval_at(q_metadata["poly"], new_x, PRIME)
    
    new_frag_id = str(uuid.uuid4())
    DB_FRAGMENTS[new_frag_id] = {
        "question_id": req.question_id,
        "x": new_x,
        "y": str(new_y)
    }
    
    return {
        "message": "Fragment regenerated successfully",
        "new_fragment_id": new_frag_id
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "fragments_stored": len(DB_FRAGMENTS)}

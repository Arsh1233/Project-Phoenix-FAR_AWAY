"""
Edge Agent — Flask application for Project PHOENIX.

Simulates an exam center machine that:
  • Caches SSS fragments locally for sub-10ms question assembly
  • Manages exam sessions (start → next question → finish)
  • Accepts leak callbacks and triggers fragment regeneration
"""

import os
import time
import uuid
import logging
from flask import Flask, jsonify, request

from cache import FragmentCache
from regeneration_handler import handle_leak, configure_urls

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

CRYPTO_URL = os.environ.get("CRYPTO_URL", "http://localhost:8080")
AIML_URL = os.environ.get("AIML_URL", "http://localhost:8001")
BLOCKCHAIN_URL = os.environ.get("BLOCKCHAIN_URL", "http://localhost:8000")
CENTER_ID = os.environ.get("CENTER_ID", "edge-001")

# Push config to the regeneration handler
configure_urls(CRYPTO_URL, BLOCKCHAIN_URL, AIML_URL)

# ---------------------------------------------------------------------------
# App bootstrap
# ---------------------------------------------------------------------------

app = Flask(__name__)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s — %(message)s",
)
logger = logging.getLogger("edge-agent")

# Global state
cache = FragmentCache(default_ttl=3600)
sessions: dict[str, dict] = {}   # session_id -> session data

@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

# ---------------------------------------------------------------------------
# Sample NEET questions (used when starting an exam)
# ---------------------------------------------------------------------------

SAMPLE_QUESTIONS = [
    "Which of the following is the powerhouse of the cell? (a) Nucleus (b) Ribosome (c) Mitochondria (d) Golgi body",
    "The pH of human blood is maintained at approximately: (a) 6.4 (b) 7.0 (c) 7.4 (d) 8.0",
    "Which enzyme is responsible for unwinding the DNA double helix? (a) DNA polymerase (b) Helicase (c) Ligase (d) Topoisomerase",
    "The primary function of the loop of Henle is: (a) Filtration (b) Concentration of urine (c) Secretion (d) Reabsorption of proteins",
    "In which phase of mitosis do chromosomes align at the metaphase plate? (a) Prophase (b) Metaphase (c) Anaphase (d) Telophase",
    "The Krebs cycle occurs in the: (a) Cytoplasm (b) Mitochondrial matrix (c) Inner membrane (d) Nucleus",
    "Which of the following hormones is secreted by the adrenal medulla? (a) Cortisol (b) Aldosterone (c) Epinephrine (d) Insulin",
    "Crossing over during meiosis occurs in: (a) Leptotene (b) Zygotene (c) Pachytene (d) Diplotene",
    "The oxygen dissociation curve of haemoglobin is: (a) Linear (b) Hyperbolic (c) Sigmoid (d) Exponential",
    "Which vector is used in the Human Genome Project for cloning large DNA fragments? (a) Plasmid (b) BAC (c) Phage (d) Cosmid",
]

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

import requests as req_lib   # renamed to avoid clash with flask.request


def _generate_fragments_for_questions(questions: list[str], n: int = 5, k: int = 3) -> dict:
    """
    Call the crypto service to generate fragments for a set of questions.
    Returns { question_id: [fragment_ids] }.
    """
    payload = {
        "questions": questions,
        "n": n,
        "k": k,
        "t0": 0,  # time-lock disabled for demo (already past)
    }
    resp = req_lib.post(f"{CRYPTO_URL}/fragment/generate", json=payload, timeout=10)
    resp.raise_for_status()
    return resp.json()["question_fragments"]


def _assemble_question(question_id: str, fragment_ids: list[str]) -> str:
    """Call the crypto service to assemble a question from fragment IDs."""
    payload = {
        "question_id": question_id,
        "fragment_ids": fragment_ids,
    }
    resp = req_lib.post(f"{CRYPTO_URL}/fragment/assemble", json=payload, timeout=10)
    resp.raise_for_status()
    return resp.json()["question_text"]


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "healthy",
        "service": "edge-agent",
        "center_id": CENTER_ID,
        "cache": cache.stats(),
        "active_sessions": len(sessions),
    })


@app.route("/exam/start", methods=["POST"])
def exam_start():
    """
    Create a new exam session for a candidate.
    Generates fragments for all questions, caches them locally.
    """
    body = request.get_json(silent=True) or {}
    candidate_id = body.get("candidate_id", f"candidate-{uuid.uuid4().hex[:8]}")
    questions = body.get("questions", SAMPLE_QUESTIONS)
    n = body.get("n", 5)
    k = body.get("k", 3)

    logger.info(f"Starting exam for {candidate_id} with {len(questions)} questions")

    try:
        # Generate fragments via crypto service
        q_fragments = _generate_fragments_for_questions(questions, n=n, k=k)
    except Exception as e:
        logger.error(f"Failed to generate fragments: {e}")
        return jsonify({"error": str(e)}), 502

    # Cache all fragments locally & build the question order
    question_order = []
    for q_id, frag_ids in q_fragments.items():
        question_order.append({
            "question_id": q_id,
            "fragment_ids": frag_ids,
        })
        # Cache each fragment mapping
        for frag_id in frag_ids:
            cache.set(frag_id, {"question_id": q_id, "fragment_id": frag_id})

    session_id = str(uuid.uuid4())
    sessions[session_id] = {
        "candidate_id": candidate_id,
        "questions": question_order,
        "current_index": 0,
        "started_at": time.time(),
        "n": n,
        "k": k,
    }

    logger.info(
        f"Session {session_id[:8]}... created — "
        f"{len(question_order)} questions, {n} fragments each (k={k})"
    )

    return jsonify({
        "session_id": session_id,
        "candidate_id": candidate_id,
        "total_questions": len(question_order),
        "message": "Exam session created. Call /exam/next to get questions.",
    })


@app.route("/exam/next", methods=["POST"])
def exam_next():
    """
    Return the next question for a session by assembling from cached fragments.
    Measures and reports assembly latency.
    """
    body = request.get_json(silent=True) or {}
    session_id = body.get("session_id")
    if not session_id or session_id not in sessions:
        return jsonify({"error": "Invalid or missing session_id"}), 400

    session = sessions[session_id]
    idx = session["current_index"]

    if idx >= len(session["questions"]):
        return jsonify({
            "message": "Exam complete. No more questions.",
            "session_id": session_id,
            "questions_answered": idx,
        })

    q_info = session["questions"][idx]
    question_id = q_info["question_id"]
    fragment_ids = q_info["fragment_ids"]

    # Use first k fragment IDs for assembly
    k = session["k"]
    assembly_ids = fragment_ids[:k]

    # Simulate fetching the actual fragments from the local cache
    network_fetches = 0
    for fid in assembly_ids:
        cached_data = cache.get(fid)
        if not cached_data:
            logger.warning(f"Cache MISS for fragment {fid[:8]}... re-fetching from network")
            network_fetches += 1

    if network_fetches > 0:
        # Simulate WAN latency to fetch missing fragments from central Crypto Engine
        time.sleep(0.15 * network_fetches)

    # Measure assembly latency
    t0 = time.perf_counter()
    try:
        question_text = _assemble_question(question_id, assembly_ids)
    except Exception as e:
        logger.error(f"Assembly failed for question {question_id[:8]}...: {e}")
        return jsonify({"error": f"Assembly failed: {str(e)}"}), 502
    latency_ms = (time.perf_counter() - t0) * 1000

    # Advance cursor
    session["current_index"] = idx + 1

    # Log access to blockchain
    try:
        req_lib.post(
            f"{BLOCKCHAIN_URL}/access",
            json={
                "candidate_id": session["candidate_id"],
                "fragment_id": fragment_ids[0],
                "center_id": CENTER_ID,
            },
            timeout=3,
        )
    except Exception:
        pass  # non-critical — don't block the exam

    logger.info(
        f"Session {session_id[:8]}... — Q{idx + 1} assembled in {latency_ms:.2f}ms"
    )

    return jsonify({
        "session_id": session_id,
        "question_number": idx + 1,
        "total_questions": len(session["questions"]),
        "question_text": question_text,
        "assembly_latency_ms": round(latency_ms, 2),
    })


@app.route("/callback/leak", methods=["POST"])
def callback_leak():
    """
    Webhook endpoint called when a leak is detected.
    Triggers fragment regeneration and cache update.

    Expected payload:
    {
        "fragment_id": "...",
        "question_id": "...",
        "compromised_hash": "..."   (optional, for logging)
    }
    """
    body = request.get_json(silent=True) or {}
    fragment_id = body.get("fragment_id")
    question_id = body.get("question_id")

    if not fragment_id or not question_id:
        return jsonify({"error": "fragment_id and question_id are required"}), 400

    compromised_hash = body.get("compromised_hash", "unknown")
    logger.warning(
        f"[LEAK] Received leak callback — hash {compromised_hash[:8]}... "
        f"fragment {fragment_id[:8]}... question {question_id[:8]}..."
    )

    result = handle_leak(cache, fragment_id, question_id, center_id=CENTER_ID)

    # Update any active sessions that reference the compromised fragment
    if result["status"] == "regenerated":
        new_frag_id = result["new_fragment_id"]
        for sid, sess in sessions.items():
            for q in sess["questions"]:
                if q["question_id"] == question_id and fragment_id in q["fragment_ids"]:
                    q["fragment_ids"] = [
                        new_frag_id if fid == fragment_id else fid
                        for fid in q["fragment_ids"]
                    ]
                    logger.info(
                        f"Session {sid[:8]}... updated with new fragment "
                        f"{new_frag_id[:8]}..."
                    )

    return jsonify(result)


@app.route("/cache/stats", methods=["GET"])
def cache_stats():
    """Return current cache statistics."""
    return jsonify(cache.stats())


@app.route("/cache/clear", methods=["POST"])
def cache_clear():
    """Flush the entire local fragment cache."""
    removed = cache.clear()
    return jsonify({"cleared": removed})


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    logger.info(f"Edge Agent starting on port {port} — center {CENTER_ID}")
    logger.info(f"  Crypto  → {CRYPTO_URL}")
    logger.info(f"  AIML    → {AIML_URL}")
    logger.info(f"  Chain   → {BLOCKCHAIN_URL}")
    app.run(host="0.0.0.0", port=port, debug=False)

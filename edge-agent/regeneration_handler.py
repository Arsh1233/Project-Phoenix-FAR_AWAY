"""
Regeneration Handler — Handles leak detection callbacks and fragment regeneration.

When a leak is detected, this module:
1. Invalidates the compromised fragment in the local cache
2. Calls the crypto service /fragment/regenerate to get a new share
3. Stores the new fragment in the local cache
4. Logs the entire event to the blockchain audit trail
"""

import logging
import requests

logger = logging.getLogger("edge-agent.regeneration")

# Service URLs (overridden by env vars in Docker)
CRYPTO_URL = "http://localhost:8080"
BLOCKCHAIN_URL = "http://localhost:8000"
AIML_URL = "http://localhost:8001"


def configure_urls(crypto_url: str, blockchain_url: str, aiml_url: str):
    """Update service URLs (called from app.py with env-var values)."""
    global CRYPTO_URL, BLOCKCHAIN_URL, AIML_URL
    CRYPTO_URL = crypto_url
    BLOCKCHAIN_URL = blockchain_url
    AIML_URL = aiml_url


def handle_leak(cache, fragment_id: str, question_id: str, center_id: str = "edge-001") -> dict:
    """
    Full regeneration pipeline for a compromised fragment.

    Args:
        cache:        FragmentCache instance
        fragment_id:  The compromised fragment's ID
        question_id:  The question this fragment belongs to
        center_id:    This edge center's identifier

    Returns:
        dict with status, new_fragment_id, and timing info
    """
    import time
    start = time.time()

    logger.warning(
        f"[LEAK] Detected compromised fragment {fragment_id[:8]}... "
        f"for question {question_id[:8]}..."
    )

    # Step 1 — Invalidate local cache
    cache.invalidate(fragment_id)
    logger.info(f"[LEAK] Local cache invalidated for {fragment_id[:8]}...")

    # Step 2 — Call crypto service to regenerate the fragment
    try:
        regen_resp = requests.post(
            f"{CRYPTO_URL}/fragment/regenerate",
            json={
                "question_id": question_id,
                "compromised_fragment_id": fragment_id,
            },
            timeout=5,
        )
        regen_resp.raise_for_status()
        regen_data = regen_resp.json()
        new_fragment_id = regen_data["new_fragment_id"]
    except requests.RequestException as e:
        logger.error(f"[LEAK] Crypto regeneration failed: {e}")
        return {
            "status": "error",
            "detail": f"Crypto service error: {str(e)}",
            "elapsed_ms": round((time.time() - start) * 1000, 2),
        }

    # Step 3 — Cache the new fragment locally
    # (We don't have the x/y values returned directly, but the crypto service
    #  stores them internally. We cache the mapping so /exam/next can use it.)
    cache.set(new_fragment_id, {
        "question_id": question_id,
        "regenerated_from": fragment_id,
    })
    logger.info(
        f"[LEAK] New fragment {new_fragment_id[:8]}... cached. "
        f"Regenerating fragments -> Done. Exam continues."
    )

    # Step 4 — Log the regeneration event to the blockchain audit trail
    try:
        requests.post(
            f"{BLOCKCHAIN_URL}/access",
            json={
                "candidate_id": "SYSTEM_REGEN",
                "fragment_id": new_fragment_id,
                "center_id": center_id,
            },
            timeout=5,
        )
    except requests.RequestException as e:
        logger.warning(f"[LEAK] Blockchain logging failed (non-critical): {e}")

    elapsed = round((time.time() - start) * 1000, 2)

    return {
        "status": "regenerated",
        "compromised_fragment_id": fragment_id,
        "new_fragment_id": new_fragment_id,
        "question_id": question_id,
        "elapsed_ms": elapsed,
    }

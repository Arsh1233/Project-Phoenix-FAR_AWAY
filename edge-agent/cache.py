"""
Fragment Cache — In-memory cache with TTL for the Edge Agent.

Uses a simple dict + timestamps (no Redis) for sub-10ms assembly latency.
Each entry stores: { "data": ..., "expires_at": float }
"""

import time
import threading
import logging

logger = logging.getLogger("edge-agent.cache")


class FragmentCache:
    """Thread-safe in-memory fragment cache with per-entry TTL."""

    def __init__(self, default_ttl: int = 3600):
        """
        Args:
            default_ttl: Default time-to-live in seconds (default 1 hour).
        """
        self._store: dict = {}
        self._lock = threading.Lock()
        self.default_ttl = default_ttl

    # ------------------------------------------------------------------
    # Core operations
    # ------------------------------------------------------------------

    def set(self, key: str, value: dict, ttl: int | None = None) -> None:
        """Store a value with optional custom TTL."""
        ttl = ttl if ttl is not None else self.default_ttl
        with self._lock:
            self._store[key] = {
                "data": value,
                "expires_at": time.time() + ttl,
            }

    def get(self, key: str) -> dict | None:
        """Retrieve a value if it exists and hasn't expired."""
        with self._lock:
            entry = self._store.get(key)
            if entry is None:
                return None
            if time.time() > entry["expires_at"]:
                del self._store[key]
                return None
            return entry["data"]

    def invalidate(self, key: str) -> bool:
        """Remove a single key. Returns True if it existed."""
        with self._lock:
            if key in self._store:
                del self._store[key]
                logger.info(f"Cache INVALIDATED: {key}")
                return True
            return False

    def invalidate_by_question(self, question_id: str) -> int:
        """
        Remove all cached fragments belonging to a given question_id.
        Returns the number of entries removed.
        """
        removed = 0
        with self._lock:
            keys_to_remove = [
                k for k, v in self._store.items()
                if v["data"].get("question_id") == question_id
            ]
            for k in keys_to_remove:
                del self._store[k]
                removed += 1
        if removed:
            logger.info(
                f"Cache PURGED {removed} fragment(s) for question {question_id}"
            )
        return removed

    def get_fragments_for_question(self, question_id: str) -> list[dict]:
        """Return all cached (non-expired) fragments for a question."""
        now = time.time()
        results = []
        with self._lock:
            for key, entry in list(self._store.items()):
                if now > entry["expires_at"]:
                    del self._store[key]
                    continue
                if entry["data"].get("question_id") == question_id:
                    results.append({**entry["data"], "fragment_id": key})
        return results

    # ------------------------------------------------------------------
    # Bulk operations
    # ------------------------------------------------------------------

    def bulk_set(self, fragments: dict[str, dict], ttl: int | None = None) -> int:
        """
        Store multiple fragments at once.
        Args:
            fragments: { fragment_id: { question_id, x, y, ... } }
        Returns:
            Number of entries stored.
        """
        ttl = ttl if ttl is not None else self.default_ttl
        expires = time.time() + ttl
        with self._lock:
            for frag_id, frag_data in fragments.items():
                self._store[frag_id] = {
                    "data": frag_data,
                    "expires_at": expires,
                }
        count = len(fragments)
        logger.info(f"Cache BULK SET: {count} fragment(s)")
        return count

    def clear(self) -> int:
        """Flush the entire cache. Returns number of entries removed."""
        with self._lock:
            count = len(self._store)
            self._store.clear()
        logger.info(f"Cache CLEARED: {count} entries")
        return count

    # ------------------------------------------------------------------
    # Stats
    # ------------------------------------------------------------------

    def stats(self) -> dict:
        """Return cache statistics."""
        now = time.time()
        with self._lock:
            total = len(self._store)
            expired = sum(
                1 for v in self._store.values() if now > v["expires_at"]
            )
        return {
            "total_entries": total,
            "expired_entries": expired,
            "active_entries": total - expired,
        }

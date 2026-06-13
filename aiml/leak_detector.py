import json
import os
import time

class LeakDetector:
    def __init__(self, db_path="demo_data/leaked_hashes.json"):
        self.db_path = db_path
        self._load_db()
        
    def _load_db(self):
        try:
            with open(self.db_path, "r") as f:
                data = json.load(f)
                self.leaked_hashes = set(data.get("leaked_hashes", []))
        except FileNotFoundError:
            self.leaked_hashes = set()
            print(f"Warning: {self.db_path} not found.")

    def check_hashes(self, hashes_to_check):
        """
        Simulates checking a list of fragment hashes against a dark web leak database.
        Returns the probability of a leak and the specific hashes compromised.
        """
        # Reload to simulate live DB updates
        self._load_db()
        
        start_time = time.time()
        
        compromised = []
        for h in hashes_to_check:
            if h in self.leaked_hashes:
                compromised.append(h)
                
        # Simulate slight processing delay for realism (latency must be < 3s)
        time.sleep(0.5)
        
        probability = len(compromised) / len(hashes_to_check) if hashes_to_check else 0.0
        
        latency = time.time() - start_time
        
        return {
            "leak_probability": round(probability, 4),
            "compromised_hashes": compromised,
            "latency_seconds": round(latency, 4)
        }

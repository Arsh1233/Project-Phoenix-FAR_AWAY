import numpy as np
import pandas as pd
from sklearn.cluster import KMeans

class ShardAI:
    def __init__(self, num_tiers=5):
        self.num_tiers = num_tiers
        # We use a preset model for demonstration without needing to train every time
        self.kmeans = KMeans(n_clusters=self.num_tiers, random_state=42)
        # Dummy fit to initialize centers
        dummy_data = np.array([
            [10, 2],    # Tier 1 (Very Easy)
            [50, 10],   # Tier 2 (Easy)
            [100, 20],  # Tier 3 (Medium)
            [200, 40],  # Tier 4 (Hard)
            [500, 80]   # Tier 5 (Very Hard)
        ])
        self.kmeans.fit(dummy_data)
        
        # Mapping centers to difficulty (smaller is easier, larger is harder)
        # We sort the centers by magnitude to assign tiers 1-5 logically
        centers = self.kmeans.cluster_centers_
        magnitudes = [np.linalg.norm(c) for c in centers]
        sorted_indices = np.argsort(magnitudes)
        
        # map cluster label -> difficulty tier (1=easiest, 5=hardest)
        self.label_to_tier = {original_label: rank + 1 for rank, original_label in enumerate(sorted_indices)}
        
    def _extract_features(self, text):
        length = len(text)
        word_count = len(text.split())
        return [length, word_count]
        
    def determine_shards(self, questions):
        """
        Takes a list of questions, clusters them into 5 difficulty tiers based on text features,
        and assigns appropriate n and k for the fragment engine.
        Harder questions require higher thresholds.
        """
        features = [self._extract_features(q) for q in questions]
        
        if len(questions) < self.num_tiers:
            # For tiny batches, just predict using the pre-fitted centroids
            labels = self.kmeans.predict(features)
        else:
            # Refit on actual batch to dynamically cluster into 5 tiers
            labels = self.kmeans.fit_predict(features)
            centers = self.kmeans.cluster_centers_
            magnitudes = [np.linalg.norm(c) for c in centers]
            sorted_indices = np.argsort(magnitudes)
            self.label_to_tier = {original_label: rank + 1 for rank, original_label in enumerate(sorted_indices)}
            
        results = []
        for i, q in enumerate(questions):
            tier = self.label_to_tier[labels[i]]
            
            # Distribution Logic
            # Tier 1: n=10, k=5
            # Tier 2: n=20, k=12
            # Tier 3: n=30, k=20
            # Tier 4: n=40, k=28
            # Tier 5: n=50, k=38
            n = tier * 10
            k = int(n * 0.75) if tier > 1 else 5
            
            results.append({
                "question": q,
                "difficulty_tier": tier,
                "recommended_n": n,
                "recommended_k": k
            })
            
        return results

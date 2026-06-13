import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
import pickle
import os

def generate_synthetic_data(num_samples_per_user=200):
    """
    Generates synthetic keystroke dynamics data for 5 distinct users.
    Each row represents a sequence of 10 keystrokes (dwell times).
    """
    data = []
    labels = []
    
    # Define user profiles (mean, std) for dwell times in ms
    profiles = {
        0: (100, 20),
        1: (150, 15),
        2: (80,  25),
        3: (120, 10),
        4: (90,  5)
    }
    
    for user_id, (mean, std) in profiles.items():
        for _ in range(num_samples_per_user):
            # Generate 10 consecutive keystroke dwell times
            sequence = np.random.normal(loc=mean, scale=std, size=10)
            # Ensure no negative times
            sequence = np.maximum(sequence, 10.0)
            data.append(sequence)
            labels.append(user_id)
            
    df = pd.DataFrame(data, columns=[f"dwell_{i}" for i in range(10)])
    df["user_id"] = labels
    return df

def train_model():
    print("Generating synthetic keystroke data...")
    df = generate_synthetic_data(num_samples_per_user=500)
    
    # Save demo data
    os.makedirs("demo_data", exist_ok=True)
    df.to_csv("demo_data/keystroke_logs.csv", index=False)
    
    X = df.drop("user_id", axis=1)
    y = df["user_id"]
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print("Training RandomForest model...")
    clf = RandomForestClassifier(n_estimators=100, random_state=42)
    clf.fit(X_train, y_train)
    
    preds = clf.predict(X_test)
    acc = accuracy_score(y_test, preds)
    print(f"Model accuracy on test set: {acc * 100:.2f}%")
    
    if acc < 0.95:
        print("WARNING: Model accuracy is below 95%!")
        
    model_path = "fingerprint_model.pkl"
    with open(model_path, "wb") as f:
        pickle.dump(clf, f)
    print(f"Model saved to {model_path}")

if __name__ == "__main__":
    train_model()

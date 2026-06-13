import requests
import time

BASE_URL = "http://localhost:8000"

def submit_access(candidate_id, fragment_id, center_id):
    payload = {
        "candidate_id": candidate_id,
        "fragment_id": fragment_id,
        "center_id": center_id
    }
    response = requests.post(f"{BASE_URL}/access", json=payload)
    print(f"POST /access -> {response.status_code} : {response.json()}")
    return response

def main():
    print("--- Project Phoenix: Fragment Audit Trail Demo ---")
    
    # 1. Normal access events
    print("\n[+] Submitting normal access events...")
    submit_access("CAND-001", "FRAG-A", "CENTER-NY")
    time.sleep(1)
    submit_access("CAND-002", "FRAG-B", "CENTER-LON")
    time.sleep(1)
    submit_access("CAND-003", "FRAG-C", "CENTER-TOK")
    time.sleep(1)
    
    # 2. Simulating a conflict / possible leak
    print("\n[+] Simulating a potential leak (same fragment, different center, < 5 seconds)...")
    # First access
    submit_access("CAND-004", "FRAG-X", "CENTER-BER")
    # Immediate second access from a different center
    submit_access("CAND-005", "FRAG-X", "CENTER-PAR")
    
    # Wait a bit
    time.sleep(1)
    
    # 3. Fetching logs
    print("\n[+] Fetching full blockchain logs...")
    response = requests.get(f"{BASE_URL}/logs")
    print(f"GET /logs -> Length: {response.json().get('length')}")
    # print(response.json()) # uncomment to see full chain
    
    # 4. Verifying logs
    print("\n[+] Verifying blockchain integrity...")
    response = requests.get(f"{BASE_URL}/logs/verify")
    print(f"GET /logs/verify -> {response.json()}")

if __name__ == "__main__":
    main()

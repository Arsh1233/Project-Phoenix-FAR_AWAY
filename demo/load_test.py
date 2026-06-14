"""
Project PHOENIX — Load Test (Locust)

Simulates 100 concurrent candidates hitting the Edge Agent.
Each candidate starts an exam and loops through questions,
validating sub-10ms assembly latency.

Usage:
    # Headless mode (100 users, ramp-up 10/sec, 30s run)
    locust -f load_test.py --headless -u 100 -r 10 --run-time 30s --host http://localhost:5000

    # Web UI mode (browse to http://localhost:8089)
    locust -f load_test.py --host http://localhost:5000
"""

from locust import HttpUser, task, between, events
import time
import logging

logger = logging.getLogger("phoenix-loadtest")

# Track latency statistics
assembly_latencies = []


class ExamCandidate(HttpUser):
    """Simulates a single NEET candidate taking an exam."""

    wait_time = between(0.1, 0.5)  # short wait between questions

    def on_start(self):
        """Called once per simulated user — starts an exam session."""
        resp = self.client.post("/exam/start", json={
            "candidate_id": f"load-test-{id(self)}",
            "n": 5,
            "k": 3,
        }, name="/exam/start")

        if resp.status_code == 200:
            data = resp.json()
            self.session_id = data["session_id"]
            self.total_questions = data["total_questions"]
            self.current_q = 0
        else:
            self.session_id = None
            self.total_questions = 0
            self.current_q = 0
            logger.error(f"Failed to start exam: {resp.status_code}")

    @task
    def fetch_next_question(self):
        """Fetch the next question and track assembly latency."""
        if not self.session_id:
            return

        if self.current_q >= self.total_questions:
            # Restart a new exam session
            self.on_start()
            return

        resp = self.client.post("/exam/next", json={
            "session_id": self.session_id,
        }, name="/exam/next")

        if resp.status_code == 200:
            data = resp.json()
            if "assembly_latency_ms" in data:
                latency = data["assembly_latency_ms"]
                assembly_latencies.append(latency)
                self.current_q += 1


@events.quitting.add_listener
def on_quitting(environment, **kwargs):
    """Print assembly latency summary when the test finishes."""
    if not assembly_latencies:
        print("\nNo assembly latency data collected.")
        return

    avg = sum(assembly_latencies) / len(assembly_latencies)
    p50 = sorted(assembly_latencies)[len(assembly_latencies) // 2]
    p95 = sorted(assembly_latencies)[int(len(assembly_latencies) * 0.95)]
    p99 = sorted(assembly_latencies)[int(len(assembly_latencies) * 0.99)]
    max_lat = max(assembly_latencies)

    print(f"""
╔══════════════════════════════════════════════════════════════╗
║             ASSEMBLY LATENCY REPORT                         ║
╠══════════════════════════════════════════════════════════════╣
║  Total assemblies: {len(assembly_latencies):<40}║
║  Average latency:  {avg:<37.2f}ms ║
║  P50 latency:      {p50:<37.2f}ms ║
║  P95 latency:      {p95:<37.2f}ms ║
║  P99 latency:      {p99:<37.2f}ms ║
║  Max latency:      {max_lat:<37.2f}ms ║
╚══════════════════════════════════════════════════════════════╝
""")

    if p95 < 10:
        print("  ✓ PASS — P95 assembly latency is under 10ms")
    else:
        print("  ✗ FAIL — P95 assembly latency exceeds 10ms target")

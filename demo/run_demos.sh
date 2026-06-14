#!/bin/bash
set -e

echo "Waiting for Edge Agent to be ready..."
while ! python -c "import urllib.request; urllib.request.urlopen('http://edge-agent:5000/health')" 2>/dev/null; do
  sleep 2
done

echo "Waiting for AIML Service to be ready..."
while ! python -c "import urllib.request; urllib.request.urlopen('http://aiml:8001/docs')" 2>/dev/null; do
  sleep 2
done

echo "All services are up. Starting automated end-to-end tests."

echo "--------------------------------------------------------"
echo "Running Load Test"
echo "--------------------------------------------------------"
locust -f load_test.py --headless -u 10 -r 2 --run-time 15s --host http://edge-agent:5000

echo "--------------------------------------------------------"
echo "Running Leak Simulation"
echo "--------------------------------------------------------"
python leak_simulation.py --edge-url http://edge-agent:5000 --aiml-url http://aiml:8001

echo "--------------------------------------------------------"
echo "End-to-End Tests Complete. Sleeping infinitely."
echo "--------------------------------------------------------"
tail -f /dev/null

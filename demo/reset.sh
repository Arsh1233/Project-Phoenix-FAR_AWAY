#!/usr/bin/env bash
# =============================================================================
# Project PHOENIX — Reset Script
# Stops all containers, prunes volumes, and clears caches.
# =============================================================================

set -e

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║           PROJECT PHOENIX — RESET SCRIPT                   ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

echo "[1/4] Stopping all PHOENIX containers..."
docker-compose down --remove-orphans 2>/dev/null || true

echo "[2/4] Removing volumes..."
docker-compose down -v 2>/dev/null || true

echo "[3/4] Pruning dangling images..."
docker image prune -f 2>/dev/null || true

echo "[4/4] Clearing local caches..."
# Clear Python bytecode caches
find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
find . -name "*.pyc" -delete 2>/dev/null || true

echo ""
echo "✓ Reset complete. Run 'docker-compose up --build' to start fresh."

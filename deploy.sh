#!/bin/bash
set -e

echo "=== OmniRecord Remote Deployment Script ==="

# Navigate to project directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR"

echo "[1/3] Pulling latest changes from main branch..."
git fetch origin main
git reset --hard origin/main

echo "[2/3] Building and starting Docker container..."
docker compose down || true
docker compose up -d --build

echo "[3/3] OmniRecord deployed successfully!"
echo "Status: Running on port 8877 (http://localhost:8877)"

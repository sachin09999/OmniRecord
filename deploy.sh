#!/bin/bash
set -e

echo "=== OmniRecord Remote Deployment Script ==="

# Navigate to project directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR"

# Try git update if git repo exists, but do not wipe local zip files if git reset fails
if [ -d ".git" ]; then
  echo "[1/3] Checking git branch status..."
  git fetch origin main 2>/dev/null || true
fi

echo "[2/3] Building and starting Docker container..."
docker compose down || true
docker compose up -d --build

echo "[3/3] OmniRecord deployed successfully!"
echo "Status: Running on port 8877 (http://localhost:8877)"

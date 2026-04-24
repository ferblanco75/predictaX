#!/bin/bash
# Bandit — Static security analysis for Python code
# Usage: ./scripts/security/run-bandit.sh
# Requires: Docker, backend container running

set -e

REPORT_DIR="$(cd "$(dirname "$0")/../../reports/security" && pwd)"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "=== Bandit — Python Static Security Analysis ==="
echo "Target: backend/app/"
echo ""

# Install bandit if not present and run
docker compose exec backend sh -c "
  pip install -q bandit 2>/dev/null
  echo '--- Medium and High severity ---'
  bandit -r app/ -ll -f screen 2>/dev/null
  echo ''
  echo '--- Full JSON report ---'
  bandit -r app/ -f json -o /app/tests/bandit-report.json 2>/dev/null || true
"

# Copy report out
docker compose cp backend:/app/tests/bandit-report.json "$REPORT_DIR/bandit-$TIMESTAMP.json" 2>/dev/null || true

echo ""
echo "=== Bandit scan complete ==="
echo "JSON report: $REPORT_DIR/bandit-$TIMESTAMP.json"

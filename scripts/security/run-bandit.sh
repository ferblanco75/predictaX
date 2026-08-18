#!/bin/bash
# Bandit — Static security analysis for Python code.
# Usage: ./scripts/security/run-bandit.sh

set -euo pipefail

REPORT_DIR="${REPORT_DIR:-$(cd "$(dirname "$0")/../../reports/security" && pwd)}"
TIMESTAMP="${TIMESTAMP:-$(date +%Y%m%d_%H%M%S)}"
SERVICE="${BACKEND_SERVICE:-backend}"
FAIL_ON_FINDINGS="${FAIL_ON_FINDINGS:-false}"

mkdir -p "$REPORT_DIR"

echo "=== Bandit — Python Static Security Analysis ==="
echo "Target: backend/app/"
echo "Report: $REPORT_DIR/bandit-$TIMESTAMP.json"
echo ""

docker compose exec -T -u root "$SERVICE" python -m pip install -q --root-user-action=ignore bandit

SCAN_STATUS=0
docker compose exec -T "$SERVICE" python -m bandit -r app/ -ll -f screen || SCAN_STATUS=$?
docker compose exec -T "$SERVICE" python -m bandit -r app/ -f json > "$REPORT_DIR/bandit-$TIMESTAMP.json" || true

echo ""
echo "=== Bandit scan complete ==="
echo "JSON report: $REPORT_DIR/bandit-$TIMESTAMP.json"

if [ "$FAIL_ON_FINDINGS" = "true" ] && [ "$SCAN_STATUS" -ne 0 ]; then
  exit "$SCAN_STATUS"
fi

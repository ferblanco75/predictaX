#!/bin/bash
# npm audit — Frontend dependency vulnerability scanning.
# Usage: ./scripts/security/run-npm-audit.sh

set -euo pipefail

REPORT_DIR="${REPORT_DIR:-$(cd "$(dirname "$0")/../../reports/security" && pwd)}"
TIMESTAMP="${TIMESTAMP:-$(date +%Y%m%d_%H%M%S)}"
SERVICE="${FRONTEND_SERVICE:-frontend}"
FAIL_ON_FINDINGS="${FAIL_ON_FINDINGS:-false}"

mkdir -p "$REPORT_DIR"

echo "=== npm audit — Frontend Dependency Vulnerabilities ==="
echo "Report: $REPORT_DIR/npm-audit-$TIMESTAMP.json"
echo ""

AUDIT_STATUS=0
docker compose exec -T "$SERVICE" npm audit || AUDIT_STATUS=$?
docker compose exec -T "$SERVICE" npm audit --json > "$REPORT_DIR/npm-audit-$TIMESTAMP.json" || true

echo ""
echo "=== npm audit complete ==="
echo "JSON report: $REPORT_DIR/npm-audit-$TIMESTAMP.json"

if [ "$FAIL_ON_FINDINGS" = "true" ] && [ "$AUDIT_STATUS" -ne 0 ]; then
  exit "$AUDIT_STATUS"
fi

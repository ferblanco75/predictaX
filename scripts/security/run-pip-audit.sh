#!/bin/bash
# pip-audit — Python dependency vulnerability scanning.
# Usage: ./scripts/security/run-pip-audit.sh

set -euo pipefail

REPORT_DIR="${REPORT_DIR:-$(cd "$(dirname "$0")/../../reports/security" && pwd)}"
TIMESTAMP="${TIMESTAMP:-$(date +%Y%m%d_%H%M%S)}"
SERVICE="${BACKEND_SERVICE:-backend}"
FAIL_ON_FINDINGS="${FAIL_ON_FINDINGS:-false}"

mkdir -p "$REPORT_DIR"

echo "=== pip-audit — Python Dependency Vulnerabilities ==="
echo "Report: $REPORT_DIR/pip-audit-$TIMESTAMP.json"
echo ""

docker compose exec -T -u root "$SERVICE" python -m pip install -q --root-user-action=ignore pip-audit

AUDIT_STATUS=0
docker compose exec -T "$SERVICE" python -m pip_audit || AUDIT_STATUS=$?
docker compose exec -T "$SERVICE" python -m pip_audit --format json > "$REPORT_DIR/pip-audit-$TIMESTAMP.json" || true

echo ""
echo "=== pip-audit complete ==="
echo "JSON report: $REPORT_DIR/pip-audit-$TIMESTAMP.json"

if [ "$FAIL_ON_FINDINGS" = "true" ] && [ "$AUDIT_STATUS" -ne 0 ]; then
  exit "$AUDIT_STATUS"
fi

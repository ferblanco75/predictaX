#!/bin/bash
# npm audit — Frontend dependency vulnerability scanning
# Usage: ./scripts/security/run-npm-audit.sh
# Requires: Docker, frontend container running

set -e

REPORT_DIR="$(cd "$(dirname "$0")/../../reports/security" && pwd)"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "=== npm audit — Frontend Dependency Vulnerabilities ==="
echo ""

docker compose exec frontend npm audit 2>/dev/null || true

echo ""
echo "=== npm audit JSON report ==="
docker compose exec frontend npm audit --json 2>/dev/null > "$REPORT_DIR/npm-audit-$TIMESTAMP.json" || true

echo ""
echo "=== npm audit complete ==="
echo "JSON report: $REPORT_DIR/npm-audit-$TIMESTAMP.json"

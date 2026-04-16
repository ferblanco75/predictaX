#!/bin/bash
# OWASP ZAP Full Scan — active scan that attacks the target
# Usage: ./scripts/security/run-zap-full.sh
# WARNING: This performs active attacks. Only run against YOUR OWN services.
# Requires: Docker, backend running on predictax network

set -e

REPORT_DIR="$(cd "$(dirname "$0")/../../reports/security" && pwd)"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
NETWORK="predictax_default"
TARGET="http://backend:8000"

echo "=== OWASP ZAP Full Scan ==="
echo "WARNING: This performs active attacks against the target!"
echo "Target: $TARGET (via Docker network: $NETWORK)"
echo "Report: $REPORT_DIR/zap-full-$TIMESTAMP.html"
echo ""
echo "This may take 30-60 minutes..."
echo ""

docker run --rm \
  --network="$NETWORK" \
  -v "$REPORT_DIR:/zap/wrk/:rw" \
  -t zaproxy/zap-stable zap-full-scan.py \
  -t "$TARGET" \
  -r "zap-full-$TIMESTAMP.html" \
  -J "zap-full-$TIMESTAMP.json" \
  -I

echo ""
echo "=== Full scan complete ==="
echo "HTML report: $REPORT_DIR/zap-full-$TIMESTAMP.html"
echo "JSON report: $REPORT_DIR/zap-full-$TIMESTAMP.json"

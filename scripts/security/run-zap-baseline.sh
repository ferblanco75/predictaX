#!/bin/bash
# OWASP ZAP Baseline Scan — passive scan against backend API
# Usage: ./scripts/security/run-zap-baseline.sh
# Requires: Docker, backend running on predictax network

set -e

REPORT_DIR="$(cd "$(dirname "$0")/../../reports/security" && pwd)"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
NETWORK="predictax_default"
TARGET="http://backend:8000"

echo "=== OWASP ZAP Baseline Scan ==="
echo "Target: $TARGET (via Docker network: $NETWORK)"
echo "Report: $REPORT_DIR/zap-baseline-$TIMESTAMP.html"
echo ""

docker run --rm \
  --network="$NETWORK" \
  -v "$REPORT_DIR:/zap/wrk/:rw" \
  -t zaproxy/zap-stable zap-baseline.py \
  -t "$TARGET" \
  -r "zap-baseline-$TIMESTAMP.html" \
  -J "zap-baseline-$TIMESTAMP.json" \
  -I

echo ""
echo "=== Scan complete ==="
echo "HTML report: $REPORT_DIR/zap-baseline-$TIMESTAMP.html"
echo "JSON report: $REPORT_DIR/zap-baseline-$TIMESTAMP.json"

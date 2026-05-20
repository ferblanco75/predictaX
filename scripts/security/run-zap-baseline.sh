#!/bin/bash
# OWASP ZAP Baseline Scan — passive scan.
# Usage: TARGET=http://backend:8000 ./scripts/security/run-zap-baseline.sh

set -euo pipefail

REPORT_DIR="${REPORT_DIR:-$(cd "$(dirname "$0")/../../reports/security" && pwd)}"
TIMESTAMP="${TIMESTAMP:-$(date +%Y%m%d_%H%M%S)}"
NETWORK="${NETWORK:-predictax_default}"
TARGET="${TARGET:-http://backend:8000}"
ZAP_IMAGE="${ZAP_IMAGE:-ghcr.io/zaproxy/zaproxy:stable}"

mkdir -p "$REPORT_DIR"

echo "=== OWASP ZAP Baseline Scan ==="
echo "Target: $TARGET"
echo "Docker network: $NETWORK"
echo "Report: $REPORT_DIR/zap-baseline-$TIMESTAMP.html"
echo ""

docker run --rm \
  --network="$NETWORK" \
  -v "$REPORT_DIR:/zap/wrk/:rw" \
  "$ZAP_IMAGE" zap-baseline.py \
  -t "$TARGET" \
  -r "zap-baseline-$TIMESTAMP.html" \
  -J "zap-baseline-$TIMESTAMP.json" \
  -I

echo ""
echo "=== Scan complete ==="
echo "HTML report: $REPORT_DIR/zap-baseline-$TIMESTAMP.html"
echo "JSON report: $REPORT_DIR/zap-baseline-$TIMESTAMP.json"

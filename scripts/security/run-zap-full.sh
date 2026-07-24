#!/bin/bash
# OWASP ZAP Full Scan — active scan that attacks the target.
# Usage: TARGET=http://backend:8000 ./scripts/security/run-zap-full.sh
# WARNING: Only run against services you own.

set -euo pipefail

REPORT_DIR="${REPORT_DIR:-$(cd "$(dirname "$0")/../../reports/security" && pwd)}"
TIMESTAMP="${TIMESTAMP:-$(date +%Y%m%d_%H%M%S)}"
NETWORK="${NETWORK:-predictax_default}"
TARGET="${TARGET:-http://backend:8000}"
ZAP_IMAGE="${ZAP_IMAGE:-ghcr.io/zaproxy/zaproxy:stable}"

mkdir -p "$REPORT_DIR"

echo "=== OWASP ZAP Full Scan ==="
echo "WARNING: This performs active attacks against the target."
echo "Target: $TARGET"
echo "Docker network: $NETWORK"
echo "Report: $REPORT_DIR/zap-full-$TIMESTAMP.html"
echo ""
echo "This may take 30-60 minutes."
echo ""

docker run --rm \
  --network="$NETWORK" \
  -v "$REPORT_DIR:/zap/wrk/:rw" \
  "$ZAP_IMAGE" zap-full-scan.py \
  -t "$TARGET" \
  -r "zap-full-$TIMESTAMP.html" \
  -J "zap-full-$TIMESTAMP.json" \
  -I

echo ""
echo "=== Full scan complete ==="
echo "HTML report: $REPORT_DIR/zap-full-$TIMESTAMP.html"
echo "JSON report: $REPORT_DIR/zap-full-$TIMESTAMP.json"

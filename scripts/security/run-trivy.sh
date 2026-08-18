#!/bin/bash
# Trivy — Container image vulnerability scanning.
# Usage: ./scripts/security/run-trivy.sh

set -euo pipefail

REPORT_DIR="${REPORT_DIR:-$(cd "$(dirname "$0")/../../reports/security" && pwd)}"
TIMESTAMP="${TIMESTAMP:-$(date +%Y%m%d_%H%M%S)}"
TRIVY_IMAGE="${TRIVY_IMAGE:-aquasec/trivy:latest}"
BACKEND_IMAGE="${BACKEND_IMAGE:-predictax-backend}"
FRONTEND_IMAGE="${FRONTEND_IMAGE:-predictax-frontend}"
TRIVY_EXIT_CODE="${TRIVY_EXIT_CODE:-0}"

mkdir -p "$REPORT_DIR"

scan_image() {
  local name="$1"
  local image="$2"

  echo "--- Scanning $image ---"
  docker run --rm \
    -v /var/run/docker.sock:/var/run/docker.sock \
    -v "$REPORT_DIR:/output" \
    "$TRIVY_IMAGE" image \
    --severity HIGH,CRITICAL \
    --format json \
    --output "/output/trivy-$name-$TIMESTAMP.json" \
    "$image"

  docker run --rm \
    -v /var/run/docker.sock:/var/run/docker.sock \
    "$TRIVY_IMAGE" image \
    --severity HIGH,CRITICAL \
    --exit-code "$TRIVY_EXIT_CODE" \
    "$image"
}

echo "=== Trivy — Container Image Scanning ==="
echo "Reports: $REPORT_DIR/trivy-*-$TIMESTAMP.json"
echo ""

scan_image "backend" "$BACKEND_IMAGE"
echo ""
scan_image "frontend" "$FRONTEND_IMAGE"

echo ""
echo "=== Trivy scan complete ==="
echo "Reports: $REPORT_DIR/trivy-*-$TIMESTAMP.json"

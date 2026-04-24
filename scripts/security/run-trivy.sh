#!/bin/bash
# Trivy — Container image vulnerability scanning
# Usage: ./scripts/security/run-trivy.sh
# Requires: Docker

set -e

REPORT_DIR="$(cd "$(dirname "$0")/../../reports/security" && pwd)"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "=== Trivy — Container Image Scanning ==="
echo ""

echo "--- Scanning predictax-backend ---"
docker run --rm \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v "$REPORT_DIR:/output" \
  aquasec/trivy:latest image \
  --severity HIGH,CRITICAL \
  --format json \
  --output "/output/trivy-backend-$TIMESTAMP.json" \
  predictax-backend 2>/dev/null

docker run --rm \
  -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy:latest image \
  --severity HIGH,CRITICAL \
  predictax-backend

echo ""
echo "--- Scanning predictax-frontend ---"
docker run --rm \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v "$REPORT_DIR:/output" \
  aquasec/trivy:latest image \
  --severity HIGH,CRITICAL \
  --format json \
  --output "/output/trivy-frontend-$TIMESTAMP.json" \
  predictax-frontend 2>/dev/null

docker run --rm \
  -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy:latest image \
  --severity HIGH,CRITICAL \
  predictax-frontend

echo ""
echo "=== Trivy scan complete ==="
echo "Reports: $REPORT_DIR/trivy-*-$TIMESTAMP.json"

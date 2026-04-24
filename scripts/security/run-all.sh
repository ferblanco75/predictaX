#!/bin/bash
# Run ALL security scans sequentially
# Usage: ./scripts/security/run-all.sh
# Requires: Docker, all services running (docker compose up -d)

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "============================================"
echo "  PredictaX Security Scan Suite"
echo "  $(date)"
echo "============================================"
echo ""

echo "[1/6] npm audit (frontend dependencies)..."
bash "$SCRIPT_DIR/run-npm-audit.sh"
echo ""

echo "[2/6] pip-audit (backend dependencies)..."
bash "$SCRIPT_DIR/run-pip-audit.sh"
echo ""

echo "[3/6] Bandit (Python static analysis)..."
bash "$SCRIPT_DIR/run-bandit.sh"
echo ""

echo "[4/6] Trivy (container images)..."
bash "$SCRIPT_DIR/run-trivy.sh"
echo ""

echo "[5/6] OWASP ZAP Baseline (passive scan)..."
bash "$SCRIPT_DIR/run-zap-baseline.sh"
echo ""

echo "[6/6] Skipping ZAP Full Scan (run manually with run-zap-full.sh)"
echo ""

echo "============================================"
echo "  All scans complete!"
echo "  Reports saved to: reports/security/"
echo "============================================"
echo ""
echo "Next steps:"
echo "  1. Review reports in reports/security/"
echo "  2. For each HIGH/CRITICAL finding, create a GitHub issue"
echo "  3. Use label 'security-finding' + severity label"
echo "  4. For full active scan: ./scripts/security/run-zap-full.sh"

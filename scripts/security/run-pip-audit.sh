#!/bin/bash
# pip-audit — Python dependency vulnerability scanning
# Usage: ./scripts/security/run-pip-audit.sh
# Requires: Docker, backend container running

set -e

echo "=== pip-audit — Python Dependency Vulnerabilities ==="
echo ""

docker compose exec backend sh -c "
  pip install -q pip-audit 2>/dev/null
  pip-audit 2>/dev/null
"

echo ""
echo "=== pip-audit complete ==="

# OWASP And Security Scanning

Local security scans live under `scripts/security/` and write reports to `reports/security/`.
The reports directory is intentionally git-ignored because reports can contain sensitive URLs,
headers, payloads, and dependency details.

## Prerequisites

- Docker running.
- Local stack up with `docker compose up -d`.
- Backend reachable inside Docker as `http://backend:8000`.
- Frontend and backend images already built if running Trivy.

## Quick Run

```bash
./scripts/security/run-all.sh
```

This runs:

- `npm audit` for frontend dependencies.
- `pip-audit` for backend dependencies.
- `bandit` for Python static analysis.
- `trivy` for Docker images.
- ZAP baseline passive scan.

The full active ZAP scan is intentionally manual because it sends attack payloads:

```bash
./scripts/security/run-zap-full.sh
```

## Useful Overrides

```bash
TARGET=https://www.neuropredict.io ./scripts/security/run-zap-baseline.sh
TARGET=https://predictax-backend-rf1i.onrender.com ./scripts/security/run-zap-baseline.sh
FAIL_ON_FINDINGS=true ./scripts/security/run-pip-audit.sh
TRIVY_EXIT_CODE=1 ./scripts/security/run-trivy.sh
```

## Triage

Create a GitHub issue for every relevant HIGH or CRITICAL finding with:

- Tool name and severity.
- Package, endpoint, image, or file affected.
- Evidence from the generated report.
- Proposed fix and verification command.
- Labels: `security-finding`, severity label, area label, and `mundial-2026` when relevant.

Known accepted or blocked findings should stay open with the reason documented in the issue.

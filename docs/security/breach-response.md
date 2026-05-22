# Breach Response Runbook

This runbook defines the first-response process for suspected personal data breaches. It supports GDPR Article 33/34 and Argentina Ley 25.326 operational readiness for the MVP.

## Severity

| Severity | Examples | Response target |
| --- | --- | --- |
| Critical | Confirmed credential leak, database dump, exposed secrets, admin account compromise | Immediate containment, legal review same day |
| High | Unauthorized access to user data, exposed logs with personal data, exploitable production vulnerability | Contain within 24h |
| Medium | Limited internal exposure, dependency vulnerability without confirmed exploitation | Triage within 72h |
| Low | No personal data, blocked attempt, false positive likely | Track and close with evidence |

## First 2 Hours

- Preserve evidence: timestamps, affected URLs, logs, screenshots, commit SHAs, alert IDs.
- Stop active leakage: revoke exposed keys, disable vulnerable endpoint, block abusive IPs, rotate credentials if needed.
- Do not delete logs unless they are the source of public exposure; restrict access instead.
- Identify affected systems: frontend, backend, database, Redis, email, AI provider, analytics, monitoring.
- Open a private incident issue or internal tracker item.
- Assign an incident owner and a communications owner.

## Assessment

- What data categories are affected: email, username, password hash, IP, user-agent, predictions, consent logs, AI logs, waitlist data.
- How many users may be affected.
- Whether data was actually accessed, exfiltrated, altered, or only exposed.
- Whether the data was protected by hashing, encryption, access control, or pseudonymization.
- Whether there is risk of identity theft, account takeover, financial harm, reputational harm, or discrimination.
- Whether processors must be contacted: Vercel, Render, database provider, Sentry, Google, Resend.

## 72-Hour GDPR Clock

- Start the clock when PredictaX becomes aware of a likely personal data breach.
- If risk to individuals is likely, prepare authority notification within 72 hours.
- If high risk to individuals is likely, prepare user notification without undue delay.
- If notification is delayed, document why.
- For Argentina, review AAIP notification requirements and local counsel guidance.

## Containment Checklist

- Rotate affected API keys, JWT secrets, database passwords, OAuth secrets, and email provider keys as applicable.
- Revoke active sessions if auth secrets or user tokens may be compromised.
- Disable or patch vulnerable code path.
- Deploy fix through PR/review path where feasible; emergency hotfix can be documented after deployment.
- Re-run relevant scans: `pip-audit`, `npm audit`, Bandit, Trivy, ZAP baseline.
- Confirm logs no longer show active exploitation.

## Notification Template

Use this structure for legal review:

```text
Subject: Security notice from PredictaX

What happened:
[Plain-language summary]

When we detected it:
[Timestamp and timezone]

What information may be affected:
[Data categories]

What we have done:
[Containment and remediation]

What you should do:
[Password reset, phishing caution, support contact]

Contact:
privacy@neuropredict.io
```

## Post-Incident Review

- Write a timeline from detection to closure.
- Record root cause and contributing factors.
- Add regression tests or monitoring where possible.
- Update threat model, data processing register, and runbooks.
- Create GitHub issues for follow-up hardening.
- Document whether authority/user notification was required and why.

## Current Gaps

- Formal DPO/privacy owner assignment.
- Production database provider and processor contacts.
- Centralized incident tracker/private security advisory process.
- User-facing notification mechanism.

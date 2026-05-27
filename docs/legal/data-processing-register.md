# Data Processing Register

PredictaX MVP keeps this register as the operational source for GDPR Article 30 and Argentina Ley 25.326 review. It must be reviewed before public launch and after any provider, data category, or retention change.

## Controller

- Product: PredictaX / NeuroPredict.
- Privacy contact: `privacy@neuropredict.io`.
- DPO contact: pending formal designation.
- Main region: Latin America.
- Public site: `https://www.neuropredict.io`.

## Processing Activities

| Activity | Purpose | Data categories | Legal basis | Recipients | Retention |
| --- | --- | --- | --- | --- | --- |
| Account registration | Create and secure user accounts | Email, username, password hash, role, points, consent timestamps, age confirmation | Contract, consent, legitimate interest | Render, production database provider | While account is active; anonymized on deletion request |
| Authentication | Login, JWT issuance, session continuity | Email, password hash verification, JWT subject, IP/user-agent in API logs | Contract, legitimate interest | Render, frontend browser storage | JWT until expiry; logs per security retention |
| Prediction activity | Provide markets and user prediction history | User id, market id, probability, points wagered, timestamps | Contract | Render, production database provider | While account is active; retained against anonymized account after deletion for aggregate integrity |
| AI analysis | Generate and cache market analysis | Market context, optional user id for usage logs, provider/model, tokens, latency, cache hit, errors | Contract, legitimate interest | Google Gemini, Redis, production database provider | Usage logs for quota/security review; cache 6h by default |
| Analytics consent | Store user cookie choices | Consent categories, timestamp, consent version | Consent | Browser localStorage; backend user profile when authenticated | Until user changes preferences or consent version changes |
| Platform analytics | Measure product usage after opt-in | Page events, browser/device metadata from analytics providers | Consent | Google Analytics, Vercel Analytics, Sentry client-side after opt-in | Provider-controlled retention; review before launch |
| Security monitoring | Detect abuse and incidents | IP address, user-agent, endpoint, status code, latency, security scan reports | Legitimate interest, legal obligation | Render, GitHub Actions artifacts, internal admins | Minimize; reports are git-ignored and should be rotated |
| Waitlist and email | Early access and transactional communication | Name, email, stated interest, email delivery metadata | Consent, contract | Resend | Until access flow ends or unsubscribe/delete request |

## International Transfers

- Vercel: frontend hosting and analytics, likely US processing.
- Render: backend hosting, likely US processing.
- Database provider: pending final Neon/Supabase decision; region must be documented before launch.
- Google: Analytics and Gemini, likely US processing.
- Sentry: error monitoring, likely US processing.
- Resend: email delivery, likely US processing.

Each provider must have a reviewed DPA/SCC position before public launch.

## Security Measures

- HTTPS required in production.
- Passwords hashed with bcrypt via Passlib.
- JWT authentication and admin role checks.
- Admin, metrics, docs, and security headers hardened for production defaults.
- Rate limiting on auth and AI endpoints.
- Security scans via Bandit, pip-audit, npm audit, Trivy, and ZAP.
- Sensitive generated reports are excluded from git.

## Data Subject Rights

- Access/portability: `GET /api/users/me/data-export` returns JSON for the authenticated user.
- Deletion: `DELETE /api/users/me` requires password and explicit confirmation, then anonymizes and deactivates the account.
- Rectification: pending user settings/profile issue.
- Objection to analytics: cookie preferences can reject analytics opt-in.
- Marketing opt-out: pending unsubscribe/newsletter issue.

## Open Compliance Items

- Formal DPO/contact decision.
- Production database provider and region.
- Provider DPA/SCC review.
- Final legal review before public launch.

# Infra Backend PredictaX — Free Tier Research

> Research date: 2026-03-29
> Status: Pending team decision

## Executive Summary

There is no single free platform that covers everything (backend + DB + auth + realtime). The best strategy is combining services. This document compares all viable options and recommends architectures for the MVP phase.

---

## Platform Comparison

### Supabase (Free Tier)

| Feature | Details |
|---------|---------|
| **Database** | 500 MB PostgreSQL |
| **Auth** | 50,000 MAUs (email, social, magic link) |
| **Realtime** | Unlimited connections and messages (with rate limits per connection) |
| **Edge Functions** | 500K invocations/month, Deno/TypeScript only (no Python) |
| **Storage** | 1 GB file storage |
| **Bandwidth** | 5 GB database egress |
| **Projects** | 2 active projects max |

**Pros:**
- Auth + Realtime + PostgreSQL in one place
- Excellent developer experience
- Row-Level Security integrates with auth

**Cons:**
- Projects pause after 7 days of inactivity (can be mitigated with cron ping)
- No backups on free tier
- Edge Functions only support Deno/TS, not Python/FastAPI
- 500 MB fills fast with market history data

---

### Neon (Free Tier)

| Feature | Details |
|---------|---------|
| **Database** | 0.5 GB PostgreSQL serverless |
| **Compute** | 100 CU-hours/month (~400 hours at 0.25 CU) |
| **Auth** | 60,000 MAUs (new feature) |
| **Branches** | 10 per project |
| **Projects** | Up to 100 |
| **Egress** | 5 GB included |

**Pros:**
- Always-free PostgreSQL (no expiry)
- Scale-to-zero saves compute hours
- New Neon Auth feature (60K MAUs)
- Database branching for dev/staging

**Cons:**
- Database-only service — cannot host FastAPI
- 0.5 GB is tight for prediction markets with historical data
- Cold start 300-500ms on first connection after idle

---

### Render (Free Tier)

| Feature | Details |
|---------|---------|
| **Web Services** | 750 instance hours/month (1 service 24/7) |
| **PostgreSQL** | 1 GB, **expires after 30 days** |
| **RAM** | 512 MB per instance |
| **Redis** | 25 MB ephemeral |
| **Bandwidth** | 100 GB/month |

**Pros:**
- Native FastAPI/Python support
- Docker support
- Simple deployment from GitHub

**Cons:**
- PostgreSQL expires after 30 days (dealbreaker for persistent data)
- Cold starts of 30s-2min after 15 minutes of inactivity
- WebSocket connections die when service spins down
- No backups on free PostgreSQL

---

### Railway (No Free Tier — $5/month Hobby)

| Feature | Details |
|---------|---------|
| **Trial** | One-time $5 credit, expires in 30 days |
| **Hobby plan** | $5/month, includes $5 of resource usage |
| **Resources** | 1 GB RAM, shared vCPU, max 5 services |
| **PostgreSQL** | One-click managed, billed by usage |

**Pros:**
- Best developer experience
- Full Docker support, auto-detects FastAPI
- No cold starts (services run continuously)
- PostgreSQL + FastAPI in one place

**Cons:**
- No real free tier — $5/month minimum
- Credits consumed by always-on services
- No built-in auth

---

### Fly.io (No Free Tier for New Users)

| Feature | Details |
|---------|---------|
| **Trial** | 2 VM hours OR 7 days, whichever comes first |
| **Legacy users** | 3 shared VMs (256MB each), 3GB storage (grandfathered) |

**Verdict:** Not viable. Free tier was removed in 2024 for new users.

---

### Vercel (Hobby / Free Tier)

| Feature | Details |
|---------|---------|
| **Bandwidth** | 100 GB/month |
| **Serverless Functions** | 150,000 invocations/month |
| **Function timeout** | 10 seconds (Hobby) |
| **Python runtime** | Beta |

**Pros:**
- Native Next.js hosting (already in use for predictaX frontend)
- Auto-deploy from GitHub, preview deploys per PR

**Cons:**
- No WebSocket support (dealbreaker for realtime)
- 10-second function timeout is too limiting for backend
- Python runtime still in beta
- Hobby plan cannot be used commercially

**Verdict:** Use for frontend only (already set up).

---

### Cloudflare Workers (Free Tier)

| Feature | Details |
|---------|---------|
| **Requests** | 100,000/day |
| **CPU Time** | 10ms per invocation |
| **D1 Database** | 5 GB SQLite storage |
| **Durable Objects** | 100K requests/day |

**Pros:**
- Edge deployment, near-zero cold starts for JS
- Durable Objects support WebSockets
- Generous daily request limits

**Cons:**
- 10ms CPU limit is extremely tight for Python
- D1 is SQLite, not PostgreSQL
- Python support still in beta
- Requires significant stack rethinking

---

### Firebase (Spark Plan)

| Feature | Details |
|---------|---------|
| **Firestore** | 1 GB storage, 50K reads/day, 20K writes/day |
| **Auth** | 50,000 MAUs (email, social, phone) |
| **Realtime DB** | 1 GB storage, 100 simultaneous connections |
| **Cloud Functions** | NOT available on Spark (requires Blaze plan) |

**Pros:**
- Excellent auth (50K MAUs, industry standard)
- Native realtime capabilities

**Cons:**
- No PostgreSQL (Firestore is NoSQL — poor fit for relational prediction market data)
- Cloud Functions require Blaze plan (credit card)
- Significant vendor lock-in
- Cannot host FastAPI on free plan

---

### PlanetScale

**Status:** Free tier removed in March 2024. Minimum paid plan ~$39/month. MySQL-based (not PostgreSQL).

**Verdict:** Not an option.

---

## Recommended Architectures

### Option A — $0/month (MVP Fast Track)

```
┌─────────────┐     ┌─────────────────┐
│   Vercel    │────▶│   Supabase      │
│  (Frontend) │     │  PostgreSQL     │
│  Next.js    │     │  Auth           │
│             │     │  Realtime       │
│             │     │  Edge Functions │
└─────────────┘     └─────────────────┘
```

- Skip FastAPI initially, use Supabase directly from frontend
- Auth + Realtime + DB solved in one place
- Setup in ~1 day
- Edge Functions for server-side logic (Deno/TS only)

| Pros | Cons |
|------|------|
| $0/month | Edge Functions only Deno/TS (no Python) |
| Fastest time to MVP | Vendor lock-in |
| Auth + Realtime included | 7-day inactivity pause |
| One platform to manage | Migration cost later |

---

### Option B — $0/month (Full Stack)

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Vercel    │────▶│  Render      │────▶│   Supabase      │
│  (Frontend) │     │  (FastAPI)   │     │  (PostgreSQL +  │
│  Next.js    │     │  Backend     │     │   Auth +        │
│             │     │              │     │   Realtime)     │
└─────────────┘     └──────────────┘     └─────────────────┘
```

- FastAPI backend on Render (750 free hrs/month)
- Supabase for DB + Auth + Realtime
- Mitigate pauses with cron pings on both services

| Pros | Cons |
|------|------|
| $0/month | Render cold starts (30s-2min) |
| Full Python backend | Supabase 7-day pause |
| Complete stack | Two services to keep alive |
| Can integrate Claude API | 500 MB DB limit |

---

### Option C — $5/month (Recommended for Serious Development)

```
┌─────────────┐     ┌──────────────────────────┐
│   Vercel    │────▶│  Railway ($5/month)      │
│  (Frontend) │     │  FastAPI + PostgreSQL     │
│  Next.js    │     │  No cold starts           │
│             │     │  No pauses                │
└─────────────┘     └──────────────────────────┘
                     + Supabase Auth (free)
```

- Railway handles FastAPI + PostgreSQL 24/7
- Use Supabase Auth separately (free, 50K MAUs)
- Best developer experience

| Pros | Cons |
|------|------|
| No cold starts | $5/month |
| No pauses | Auth is separate service |
| Full Python/Docker support | Need to implement auth integration |
| Best DX of all options | |

---

## Growth Path

| Stage | Strategy | Cost |
|-------|----------|------|
| **Now (MVP)** | Option A: Vercel + Supabase | $0/month |
| **With traction** | Option C: Add Railway for FastAPI + Claude API | $5/month |
| **Scale** | Migrate to AWS/GCP with own infrastructure | Variable |

---

## Decision Required

The team needs to choose between Options A, B, or C. Key factors:

1. **Speed to MVP** → Option A (Supabase direct, no backend)
2. **Full control + Python** → Option B (free) or C ($5/month)
3. **Developer experience** → Option C (Railway, no cold starts)

The decision also affects issues #9, #10, #11, and #12 — the backend architecture depends on this choice.

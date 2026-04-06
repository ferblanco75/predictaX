# Infra Backend PredictaX — Free Tier Research

> Research date: 2026-03-29
> Updated: 2026-03-31
> Status: **DECIDED** — Vercel (frontend) + Render (backend), both free tier

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

---

# AI / LLM API — Free Tier Research

> Related to issue #12 (Claude API Integration) and #26 (AI Scope Definition)

## Platform Comparison

### Google Gemini API (Google AI Studio) — Best Free Option

| Model | RPM | RPD | TPM | Context Window |
|-------|-----|-----|-----|----------------|
| Gemini 2.5 Pro | 5 | 100 | 250,000 | 1M tokens |
| Gemini 2.5 Flash | 10 | 250 | 250,000 | 1M tokens |
| Gemini 2.5 Flash-Lite | 15 | 1,000 | 250,000 | 1M tokens |

- **Structured output:** Full JSON Schema support
- **Function calling / Tool use:** Full support including MCP protocol
- **Latency:** Flash generates at ~212 tokens/sec
- **Quality:** Flash outperforms GPT-4o-mini on most benchmarks
- **Gotchas:** Free tier data used to improve Google products. Rate limits were cut 50-80% in Dec 2025. Lower priority during peak hours.

**Verdict:** Best overall free option. 1M context window is unmatched for feeding market data/news. Flash-Lite at 1,000 RPD is enough for MVP.

---

### Groq — Fastest Inference, Generous Free Tier

| Model | RPM | RPD | TPM | TPD |
|-------|-----|-----|-----|-----|
| Llama 3.1 8B Instant | 30 | 14,400 | 6,000 | 500,000 |
| Llama 3.3 70B Versatile | 30 | 1,000 | 12,000 | 100,000 |
| Llama 4 Scout 17B | 30 | 1,000 | 30,000 | 500,000 |

- **Speed:** 700+ tokens/second on Llama 3.3 70B (fastest anywhere)
- **Structured output:** Full JSON Schema with `strict: true`
- **Function calling:** Full support
- **No credit card required**
- **Gotchas:** Low TPM limits (can't send huge context). Streaming + structured outputs incompatible simultaneously.

**Verdict:** Excellent for fast, short prediction queries. 14,400 RPD on 8B model is very generous. Feels instant for users.

---

### Mistral AI — Most Generous Token Allowance

- **Free "Experiment" tier:** Access to ALL models including Mistral Large
- **Rate limits:** ~1 RPS, 500K TPM, up to 1 billion tokens/month
- **No credit card required**
- **Structured output / Function calling:** Full support
- **Startup credits:** Up to $30K available
- **Gotchas:** 1 RPS rate limit means no bursting.

**Verdict:** 1 billion tokens/month free is massive. Access to Mistral Large (frontier-class) for free is exceptional. Strong for an MVP with moderate traffic.

---

### OpenRouter — 27+ Free Models

Notable free models ($0/MTok):
- Llama 3.3 70B (65K context)
- DeepSeek R1 (reasoning model)
- Mistral Small 3.1 24B (128K context, vision)
- OpenAI gpt-oss-120b (131K context)
- NVIDIA Nemotron 3 Super 120B (262K context)
- Qwen3 Coder 480B (262K context)

- **Rate limits:** 20 RPM, 200 RPD (1,000 RPD with purchase history)
- **No credit card required for free models**
- **Gotchas:** Free requests queued behind paid during peak. Models can be removed without notice.

**Verdict:** Excellent as fallback/routing layer. Access to 120B+ models for free is remarkable.

---

### Anthropic Claude API

- **Free credits:** $5 for new accounts (~100K-200K tokens)
- **No ongoing free tier**
- **Cheapest model:** Claude Haiku 4.5 at $1/$5 per MTok
- **Quality:** Best reasoning of any model family
- **Student program:** Up to $300 in credits

**Verdict:** Not viable as free option. Best quality but requires budget. Haiku is cost-effective if willing to pay.

---

### OpenAI API

- **Free credits:** $5 for new accounts (expires 3 months)
- **No ongoing free tier**
- **GPT-4o-mini:** $0.15/$0.60 per MTok (extremely cheap)
- **gpt-oss-20b:** New open-weight model, free on OpenRouter

**Verdict:** Similar to Claude — $5 starter credit only. GPT-4o-mini is cheapest proprietary if going paid.

---

### Cloudflare Workers AI

- **Free tier:** 10,000 neurons/day (~100-200 LLM responses)
- **Models:** Llama 3.3 70B, Mistral 7B, Gemma 3
- **Best for:** Embeddings and news classification at the edge

**Verdict:** Too few LLM responses for primary use. Good for supplementary tasks (embeddings, classification).

---

### Cohere

- **Free trial:** 1,000 API calls/month, 20 calls/min
- **Models:** Command R+, Rerank 3.5, Embed 4
- **Restriction:** Trial keys CANNOT be used commercially

**Verdict:** Too limited and no commercial use. Only useful for prototyping.

---

### Hugging Face Inference API

- **Free:** 100K monthly inference credits
- **Models:** Thousands of open-source models
- **Gotchas:** Opaque credit system, cold-start latency

**Verdict:** Best for specialized NLP tasks (sentiment analysis). Not ideal as primary LLM.

---

### Together AI

- **Signup credits:** Up to $100 free
- **200+ open-source models** including Llama 4, DeepSeek V3.1
- **Startup program:** $15K-$50K in credits

**Verdict:** Good $100 initial credit for prototyping. Not a sustained free option.

---

### Self-Hosted Open Source (VPS $6-12/month)

| Model | Size (Q4) | Min RAM | Speed (CPU) | Quality |
|-------|-----------|---------|-------------|---------|
| Phi-4 | ~5GB | 8GB | ~15 tok/s | Excellent math/reasoning |
| Llama 3.1 8B | ~5-6GB | 8GB | ~10-15 tok/s | Good general purpose |
| Mistral Small 3.1 24B | ~14GB | 16GB | ~5-8 tok/s | Very strong, vision |
| Qwen 3 4B | ~3GB | 4GB | ~20+ tok/s | Surprisingly capable |

- Deploy with Ollama (single command install)
- VPS: Contabo 8GB ~$6/month, Hetzner 16GB competitive
- Licensing: Qwen 3 (Apache 2.0), DeepSeek (MIT), Mistral Small (Apache 2.0) — all commercially free

---

## Recommended AI Strategy for predictaX

### Primary Stack (free, high quality)

```
┌──────────────────────────────────────────────────────┐
│                   AI Fallback Chain                   │
│                                                      │
│  Request ──▶ Groq (Llama 3.3 70B)                   │
│              │ 700+ tok/s, 1K RPD                    │
│              │                                       │
│              ├──▶ 429? ──▶ Gemini Flash              │
│              │            250 RPD, 1M context        │
│              │                                       │
│              ├──▶ 429? ──▶ Mistral Large             │
│              │            1B tokens/month            │
│              │                                       │
│              └──▶ 429? ──▶ OpenRouter (free models)  │
│                           DeepSeek R1, Llama, etc.   │
└──────────────────────────────────────────────────────┘
```

All four support structured JSON output — response format stays consistent across providers.

### Use Case Mapping

| Use Case | Recommended Model | Why |
|----------|-------------------|-----|
| Fast probability predictions | Groq (Llama 3.3 70B) | 700+ tok/s, structured output |
| Market analysis with context | Gemini 2.5 Flash | 1M context window for news/data |
| Content generation | Mistral Large | 1B tokens/month free |
| Deep reasoning tasks | OpenRouter (DeepSeek R1) | Free reasoning model |
| News classification | Cloudflare Workers AI | Free embeddings at edge |

### Future Scaling

| Stage | Strategy | Cost |
|-------|----------|------|
| **MVP** | Groq + Gemini + Mistral + OpenRouter | $0/month |
| **Growth** | Gemini Flash paid ($0.15/$0.60 MTok) | ~$5-20/month |
| **Scale** | Self-hosted Phi-4 on VPS + paid API for peaks | $6/month + usage |

---

## Team Decision (2026-03-31)

### Infrastructure: Option B selected — Vercel + Render (free tiers)

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Vercel    │────▶│   Render     │────▶│   Database      │
│  (Frontend) │     │  (Backend)   │     │   (TBD)         │
│  Next.js    │     │  FastAPI     │     │   PostgreSQL    │
│  Free tier  │     │  Free tier   │     │   Free tier     │
└─────────────┘     └──────────────┘     └─────────────────┘
```

**Confirmed by:** Developer
**Date:** 2026-03-31

### What this means

- **Frontend:** Vercel free tier (already configured)
- **Backend:** Render free tier — FastAPI, 750 hrs/month, 512 MB RAM
- **Cost:** $0/month

### Known Limitations to Address

| Limitation | Impact | Mitigation |
|-----------|--------|------------|
| Render cold starts (30s-2min after 15min idle) | First request after idle is slow | Cron ping every 14 min to keep alive |
| Render PostgreSQL expires after 30 days | Data loss after 30 days | **Use external DB: Neon or Supabase (always free)** |
| Render free RAM: 512 MB | May limit FastAPI + dependencies | Monitor memory usage, optimize imports |
| Render 100 GB/month bandwidth | May limit high-traffic scenarios | Sufficient for MVP |

### Pending Decision: External Database

Render's free PostgreSQL is NOT viable for persistent data (30-day expiry). The team needs to choose an external database:

| Option | Storage | Always Free | Auth Included | Realtime |
|--------|---------|-------------|---------------|----------|
| **Neon** | 0.5 GB | Yes | Yes (60K MAUs) | No |
| **Supabase** | 500 MB | Yes (pauses after 7 days) | Yes (50K MAUs) | Yes |

**Recommendation:** Neon — always free without pausing, includes auth (60K MAUs), and is a pure PostgreSQL service with no vendor lock-in.

### AI Models

The recommended strategy is the fallback chain: **Groq → Gemini → Mistral → OpenRouter** (all free). See AI section above for details.

---

> **Note:** The research and alternative options (A, B, C) above are preserved for reference. If the team needs to change direction, all comparisons remain available in this document.

These decisions affect issues #9, #10, #11, #12, and #26.

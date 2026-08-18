# AI Provider Strategy - Mundial 2026

## Decision

PredictaX uses Google Gemini Flash 2.5 as the primary AI provider for the Mundial 2026 MVP.

We will not rotate multiple free API keys to bypass provider quotas. If demand exceeds the free tier, the launch path is one of these options:

1. Upgrade Gemini to a paid plan.
2. Add a secondary provider with explicit terms and its own quota monitoring.
3. Temporarily degrade the UI by serving cached analysis only.

## Runtime Controls

- AI analysis cache TTL: 6 hours in Redis.
- Daily quota guard: stop new Gemini calls at 240/250 requests to preserve a buffer.
- POST rate limit: max 10 AI analysis requests per requester per minute.
- Same-market cooldown: one POST per requester/market per minute.
- Single-flight generation lock: one Gemini generation per market during a cache miss.
- Admin metrics include quota, cache hits, errors, and rate-limited requests.

## User Experience

When quota or rate limits are hit, the API returns clear retryable errors instead of letting repeated requests drain Gemini quota. Cached analysis remains available through the read endpoint when Redis has a cached result.

## Future Fallbacks

Potential fallback providers for a later phase: Groq, Mistral, OpenRouter, or a paid Gemini plan. Any fallback must be configured as a first-class provider with monitoring; it must not rely on key rotation to evade free-tier limits.

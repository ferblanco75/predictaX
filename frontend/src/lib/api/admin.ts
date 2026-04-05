const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

async function adminFetch(endpoint: string, token: string) {
  const res = await fetch(`${API_URL}/admin${endpoint}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error(`Admin API error: ${res.status}`);
  }
  return res.json();
}

export async function getOverview(token: string) {
  return adminFetch('/metrics/overview', token);
}

export async function getUsers(token: string, params?: { search?: string; limit?: number; offset?: number }) {
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.offset) query.set('offset', String(params.offset));
  const qs = query.toString();
  return adminFetch(`/users${qs ? `?${qs}` : ''}`, token);
}

export async function getMarketsRanking(token: string, sort = 'most_active', limit = 20) {
  return adminFetch(`/metrics/markets/ranking?sort=${sort}&limit=${limit}`, token);
}

export async function getPredictionsDaily(token: string, days = 30) {
  return adminFetch(`/metrics/predictions/daily?days=${days}`, token);
}

export async function getAIUsageSummary(token: string) {
  return adminFetch('/ai/usage/summary', token);
}

export async function getAIUsageHistory(token: string, days = 30) {
  return adminFetch(`/ai/usage/history?days=${days}`, token);
}

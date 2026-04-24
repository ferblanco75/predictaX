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

async function adminMutate(
  endpoint: string,
  token: string,
  method: 'POST' | 'PATCH' | 'DELETE' = 'POST',
  body?: unknown
) {
  const res = await fetch(`${API_URL}/admin${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: `Error ${res.status}` }));
    throw new Error(error.detail || `Admin API error: ${res.status}`);
  }
  return res.json();
}

export async function getOverview(token: string) {
  return adminFetch('/metrics/overview', token);
}

export async function getUsers(
  token: string,
  params?: { search?: string; limit?: number; offset?: number }
) {
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

export async function getTopActiveUsers(token: string, days = 30, limit = 10) {
  return adminFetch(`/metrics/users/top-active?days=${days}&limit=${limit}`, token);
}

export async function getInactiveUsers(token: string, days = 30) {
  return adminFetch(`/metrics/users/inactive?days=${days}`, token);
}

export async function getUserEngagement(token: string, days = 30) {
  return adminFetch(`/metrics/users/engagement?days=${days}`, token);
}

export async function getCategoryInterest(token: string, days = 30) {
  return adminFetch(`/metrics/categories/interest?days=${days}`, token);
}

export async function getSitePerformance(token: string, days = 7) {
  return adminFetch(`/metrics/performance?days=${days}`, token);
}

export async function getRecentActivity(token: string, limit = 20) {
  return adminFetch(`/activity/recent?limit=${limit}`, token);
}

// --------------- User Actions ---------------

export async function toggleUserActive(token: string, userId: string) {
  return adminMutate(`/users/${userId}/toggle-active`, token, 'PATCH');
}

export async function updateUserRole(token: string, userId: string, role: 'user' | 'admin') {
  return adminMutate(`/users/${userId}/role`, token, 'PATCH', { role });
}

export async function updateUserPoints(token: string, userId: string, points: number) {
  return adminMutate(`/users/${userId}/points`, token, 'PATCH', { points });
}

// --------------- Market Actions ---------------

export async function resolveMarket(token: string, marketId: string, resolutionValue: boolean) {
  return adminMutate(`/markets/${marketId}/resolve`, token, 'POST', {
    resolution_value: resolutionValue,
  });
}

export async function cancelMarket(token: string, marketId: string) {
  return adminMutate(`/markets/${marketId}/cancel`, token, 'POST');
}

export async function editMarket(
  token: string,
  marketId: string,
  data: { title?: string; description?: string; end_date?: string }
) {
  return adminMutate(`/markets/${marketId}`, token, 'PATCH', data);
}

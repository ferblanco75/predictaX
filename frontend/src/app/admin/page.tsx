'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/stores/app-store';
import { getOverview, getTopActiveUsers, getRecentActivity, getCategoryInterest } from '@/lib/api/admin';
import {
  Users, TrendingUp, BarChart3, Bot, Activity, Zap,
  Trophy, Clock, ArrowUpRight, ArrowDownRight, Minus,
} from 'lucide-react';

interface Overview {
  users: { total: number; new_today: number; new_this_week: number; new_this_month: number };
  markets: { total: number; active: number; resolved: number; by_category: Record<string, number> };
  predictions: { total: number; today: number; this_week: number; volume_total: number; volume_today: number };
  ai: {
    requests_today: number; cache_hits_today: number; cache_hit_rate: number;
    avg_latency_ms: number; quota_used: number; quota_limit: number; quota_remaining: number;
  };
}

interface TopUser {
  id: string; username: string; email: string;
  predictions_count: number; total_wagered: number; points: number;
}

interface ActivityItem {
  type: string; user: string; action: string;
  target: string; points: number; timestamp: string;
}

interface CategoryData {
  category: string; predictions_count: number; volume: number; unique_users: number;
}

function KPICard({
  title, value, subtitle, icon: Icon, color,
}: {
  title: string; value: string | number; subtitle?: string; icon: React.ElementType; color: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-500">{title}</span>
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
      </div>
      <div className="text-2xl font-bold">{value}</div>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </div>
  );
}

function QuotaBar({ used, limit }: { used: number; limit: number }) {
  const percent = Math.min((used / limit) * 100, 100);
  const color = percent > 80 ? 'bg-red-500' : percent > 50 ? 'bg-yellow-500' : 'bg-green-500';
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-500">Gemini Quota</span>
        <span className="font-medium">{used}/{limit} RPD</span>
      </div>
      <div className="h-2.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function CategoryBreakdown({ data }: { data: Record<string, number> }) {
  const colors: Record<string, string> = {
    economia: 'bg-green-500',
    politica: 'bg-blue-500',
    deportes: 'bg-amber-500',
    tecnologia: 'bg-violet-500',
    crypto: 'bg-orange-500',
  };
  const total = Object.values(data).reduce((a, b) => a + b, 0);
  return (
    <div className="space-y-2">
      {Object.entries(data).map(([cat, count]) => {
        const pct = total > 0 ? (count / total) * 100 : 0;
        return (
          <div key={cat}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${colors[cat] || 'bg-gray-400'}`} />
                <span className="text-sm capitalize">{cat}</span>
              </div>
              <span className="text-sm font-medium">{count}</span>
            </div>
            <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${colors[cat] || 'bg-gray-400'}`} style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function timeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `hace ${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  return `hace ${days}d`;
}

export default function AdminDashboard() {
  const { user } = useAppStore();
  const [data, setData] = useState<Overview | null>(null);
  const [topUsers, setTopUsers] = useState<TopUser[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user?.token) return;
    Promise.all([
      getOverview(user.token),
      getTopActiveUsers(user.token, 30, 5),
      getRecentActivity(user.token, 10),
      getCategoryInterest(user.token, 30),
    ])
      .then(([overview, users, feed, cats]) => {
        setData(overview);
        setTopUsers(users);
        setActivity(feed);
        setCategories(cats);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));

    const interval = setInterval(() => {
      if (!user?.token) return;
      Promise.all([
        getOverview(user.token),
        getRecentActivity(user.token, 10),
      ]).then(([overview, feed]) => {
        setData(overview);
        setActivity(feed);
      }).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, [user?.token]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-gray-200 dark:bg-gray-800 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
        <p className="text-red-600 font-medium">Error al cargar métricas</p>
        <p className="text-red-400 text-sm mt-1">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-gray-500 text-sm">Overview de la plataforma en tiempo real</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          Auto-refresh 30s
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Usuarios Totales"
          value={data.users.total}
          subtitle={`+${data.users.new_today} hoy / +${data.users.new_this_week} esta semana`}
          icon={Users}
          color="bg-blue-500"
        />
        <KPICard
          title="Mercados Activos"
          value={data.markets.active}
          subtitle={`${data.markets.total} total / ${data.markets.resolved} resueltos`}
          icon={TrendingUp}
          color="bg-green-500"
        />
        <KPICard
          title="Predicciones Hoy"
          value={data.predictions.today}
          subtitle={`${data.predictions.total} total / $${data.predictions.volume_today.toLocaleString()} vol. hoy`}
          icon={BarChart3}
          color="bg-purple-500"
        />
        <KPICard
          title="AI Requests Hoy"
          value={data.ai.requests_today}
          subtitle={`Cache hit: ${Math.round(data.ai.cache_hit_rate * 100)}% / Latencia: ${data.ai.avg_latency_ms}ms`}
          icon={Bot}
          color="bg-amber-500"
        />
      </div>

      {/* Second Row: 3 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* AI Quota */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" />
            Gemini AI Quota
          </h3>
          <QuotaBar used={data.ai.quota_used} limit={data.ai.quota_limit} />
          <div className="grid grid-cols-3 gap-2 mt-4 text-center">
            <div>
              <div className="text-lg font-bold">{data.ai.requests_today}</div>
              <div className="text-xs text-gray-400">Requests</div>
            </div>
            <div>
              <div className="text-lg font-bold">{data.ai.cache_hits_today}</div>
              <div className="text-xs text-gray-400">Cache Hits</div>
            </div>
            <div>
              <div className="text-lg font-bold">{data.ai.quota_remaining}</div>
              <div className="text-xs text-gray-400">Restantes</div>
            </div>
          </div>
        </div>

        {/* Markets by Category */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
            <Activity className="h-4 w-4 text-green-500" />
            Mercados por Categoría
          </h3>
          <CategoryBreakdown data={data.markets.by_category} />
        </div>

        {/* Quick Stats */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <h3 className="text-sm font-medium mb-4">Resumen de Actividad</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Predicciones esta semana</span>
              <span className="font-medium">{data.predictions.this_week}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Volumen total</span>
              <span className="font-medium">${data.predictions.volume_total.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Nuevos usuarios (mes)</span>
              <span className="font-medium">{data.users.new_this_month}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Mercados resueltos</span>
              <span className="font-medium">{data.markets.resolved}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Third Row: Top Users + Activity Feed + Category Interest */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Top Active Users */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-500" />
            Top Usuarios (30 días)
          </h3>
          {topUsers.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">Sin actividad aún</p>
          ) : (
            <div className="space-y-3">
              {topUsers.map((u, i) => (
                <div key={u.id} className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    i === 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400' :
                    i === 1 ? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' :
                    i === 2 ? 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400' :
                    'bg-gray-50 text-gray-400 dark:bg-gray-900 dark:text-gray-500'
                  }`}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{u.username}</div>
                    <div className="text-xs text-gray-400">{u.predictions_count} predicciones</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">${u.total_wagered.toLocaleString()}</div>
                    <div className="text-xs text-gray-400">apostado</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Activity Feed */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-500" />
            Actividad Reciente
          </h3>
          {activity.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">Sin actividad reciente</p>
          ) : (
            <div className="space-y-3">
              {activity.map((a, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-sm">
                      <span className="font-medium">{a.user}</span>{' '}
                      <span className="text-gray-500">{a.action}</span>{' '}
                      <span className="font-medium truncate">{a.target.length > 40 ? a.target.slice(0, 40) + '...' : a.target}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                      <span>{a.points} pts</span>
                      <span>{timeAgo(a.timestamp)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Category Interest */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-purple-500" />
            Interés por Categoría (30d)
          </h3>
          {categories.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">Sin datos aún</p>
          ) : (
            <div className="space-y-3">
              {categories.map((c) => (
                <div key={c.category} className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium capitalize">{c.category}</div>
                    <div className="text-xs text-gray-400">
                      {c.predictions_count} predicciones / {c.unique_users} usuarios
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">${c.volume.toLocaleString()}</div>
                    <div className="text-xs text-gray-400">volumen</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

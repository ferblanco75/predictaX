'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/stores/app-store';
import { getOverview } from '@/lib/api/admin';
import { Users, TrendingUp, BarChart3, Bot, Activity, Zap } from 'lucide-react';

interface Overview {
  users: { total: number; new_today: number; new_this_week: number; new_this_month: number };
  markets: { total: number; active: number; resolved: number; by_category: Record<string, number> };
  predictions: { total: number; today: number; this_week: number; volume_total: number; volume_today: number };
  ai: {
    requests_today: number; cache_hits_today: number; cache_hit_rate: number;
    avg_latency_ms: number; quota_used: number; quota_limit: number; quota_remaining: number;
  };
}

function KPICard({
  title, value, subtitle, icon: Icon, color,
}: {
  title: string; value: string | number; subtitle?: string; icon: React.ElementType; color: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
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
      {Object.entries(data).map(([cat, count]) => (
        <div key={cat} className="flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full ${colors[cat] || 'bg-gray-400'}`} />
          <span className="text-sm capitalize flex-1">{cat}</span>
          <span className="text-sm font-medium">{count}</span>
          <span className="text-xs text-gray-400">{total > 0 ? Math.round((count / total) * 100) : 0}%</span>
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboard() {
  const { user } = useAppStore();
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user?.token) return;
    getOverview(user.token)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));

    // Refresh every 30s
    const interval = setInterval(() => {
      if (user?.token) getOverview(user.token).then(setData).catch(() => {});
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
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-gray-500 text-sm">Overview de la plataforma en tiempo real</p>
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

      {/* Second Row */}
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
    </div>
  );
}

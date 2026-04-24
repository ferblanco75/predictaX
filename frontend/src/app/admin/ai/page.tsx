'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/stores/app-store';
import { getAIUsageSummary, getAIUsageHistory } from '@/lib/api/admin';
import { Bot, Zap, Clock, AlertTriangle, Database } from 'lucide-react';

interface AISummary {
  today: {
    requests: number;
    cache_hits: number;
    tokens: number;
    avg_latency_ms: number;
    errors: number;
  };
  this_week: { requests: number; tokens: number };
  quota: { daily_limit: number; used_today: number; remaining: number; usage_percent: number };
  cache_hit_rate: number;
  top_markets_analyzed: { market_id: string; title: string; analysis_count: number }[];
}

interface DailyAI {
  date: string;
  requests: number;
  cache_hits: number;
  tokens: number;
}

function QuotaGauge({ used, limit }: { used: number; limit: number }) {
  const percent = Math.min((used / limit) * 100, 100);
  const color = percent > 80 ? 'text-red-500' : percent > 50 ? 'text-yellow-500' : 'text-green-500';
  const bgColor = percent > 80 ? 'bg-red-500' : percent > 50 ? 'bg-yellow-500' : 'bg-green-500';
  return (
    <div className="text-center">
      <div className="relative w-32 h-32 mx-auto">
        <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r="50"
            fill="none"
            stroke="currentColor"
            strokeWidth="10"
            className="text-gray-200 dark:text-gray-800"
          />
          <circle
            cx="60"
            cy="60"
            r="50"
            fill="none"
            stroke="currentColor"
            strokeWidth="10"
            className={color}
            strokeDasharray={`${percent * 3.14} ${(100 - percent) * 3.14}`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold">{used}</span>
          <span className="text-xs text-gray-400">/ {limit}</span>
        </div>
      </div>
      <div className={`mt-2 text-sm font-medium ${color}`}>{percent.toFixed(0)}% usado</div>
      <div className="mt-1 flex justify-center">
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
            percent > 80
              ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
              : percent > 50
                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400'
                : 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400'
          }`}
        >
          {percent > 80 ? 'Quota baja' : percent > 50 ? 'Moderado' : 'Saludable'}
        </span>
      </div>
    </div>
  );
}

export default function AdminAIPage() {
  const { user } = useAppStore();
  const [summary, setSummary] = useState<AISummary | null>(null);
  const [history, setHistory] = useState<DailyAI[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.token) return;
    Promise.all([getAIUsageSummary(user.token), getAIUsageHistory(user.token, 30)])
      .then(([s, h]) => {
        setSummary(s);
        setHistory(h);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    const interval = setInterval(() => {
      if (user?.token) {
        getAIUsageSummary(user.token)
          .then(setSummary)
          .catch(() => {});
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [user?.token]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 bg-gray-200 dark:bg-gray-800 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!summary) return null;

  const maxRequests = Math.max(...history.map((d) => d.requests + d.cache_hits), 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">AI / LLM</h1>
        <p className="text-gray-500 text-sm">Monitoreo de uso de Google Gemini Flash 2.5</p>
      </div>

      {/* Top row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Quota gauge */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" />
            Quota Diaria (RPD)
          </h3>
          <QuotaGauge used={summary.quota.used_today} limit={summary.quota.daily_limit} />
        </div>

        {/* Today stats */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Bot className="h-4 w-4 text-blue-500" />
            Hoy
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Requests a Gemini</span>
              <span className="font-medium">{summary.today.requests}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Cache Hits</span>
              <span className="font-medium">{summary.today.cache_hits}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Cache Hit Rate</span>
              <span className="font-medium">{Math.round(summary.cache_hit_rate * 100)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Tokens consumidos</span>
              <span className="font-medium">{summary.today.tokens.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500 flex items-center gap-1">
                <Clock className="h-3 w-3" /> Latencia promedio
              </span>
              <span className="font-medium">{summary.today.avg_latency_ms}ms</span>
            </div>
            {summary.today.errors > 0 && (
              <div className="flex justify-between text-red-500">
                <span className="text-sm flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> Errores
                </span>
                <span className="font-medium">{summary.today.errors}</span>
              </div>
            )}
          </div>
        </div>

        {/* Week stats */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Database className="h-4 w-4 text-green-500" />
            Esta Semana
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Requests totales</span>
              <span className="font-medium">{summary.this_week.requests}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Tokens consumidos</span>
              <span className="font-medium">{summary.this_week.tokens.toLocaleString()}</span>
            </div>
          </div>

          <h3 className="text-sm font-medium mt-6 mb-3">Top Mercados Analizados</h3>
          {summary.top_markets_analyzed.length === 0 ? (
            <p className="text-gray-400 text-sm">Sin análisis aún</p>
          ) : (
            <div className="space-y-2">
              {summary.top_markets_analyzed.map((m) => (
                <div key={m.market_id} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-[180px]">
                    {m.title}
                  </span>
                  <span className="text-xs font-medium bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded">
                    {m.analysis_count}x
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Usage history chart */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
        <h3 className="text-sm font-medium mb-4">Historial de Uso (30 días)</h3>
        {history.length === 0 ? (
          <p className="text-gray-400 text-center py-12">No hay historial de uso aún</p>
        ) : (
          <div className="flex items-end gap-1 h-40">
            {history.map((d) => {
              const total = d.requests + d.cache_hits;
              const height = (total / maxRequests) * 100;
              const cachePercent = total > 0 ? (d.cache_hits / total) * 100 : 0;
              return (
                <div
                  key={d.date}
                  className="flex-1 flex flex-col items-center gap-1 group relative"
                >
                  <div
                    className="w-full rounded-t overflow-hidden"
                    style={{ height: `${height}%` }}
                  >
                    <div
                      className="bg-blue-500 w-full"
                      style={{ height: `${100 - cachePercent}%` }}
                    />
                    <div
                      className="bg-blue-300 dark:bg-blue-700 w-full"
                      style={{ height: `${cachePercent}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-gray-400 -rotate-45 origin-top-left whitespace-nowrap">
                    {new Date(d.date).toLocaleDateString('es-AR', {
                      day: '2-digit',
                      month: '2-digit',
                    })}
                  </span>
                  <div className="absolute bottom-full mb-2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                    {d.requests} API / {d.cache_hits} cache / {d.tokens.toLocaleString()} tokens
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div className="flex gap-4 mt-3 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-blue-500 rounded" /> API requests
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-blue-300 dark:bg-blue-700 rounded" /> Cache hits
          </span>
        </div>
      </div>
    </div>
  );
}

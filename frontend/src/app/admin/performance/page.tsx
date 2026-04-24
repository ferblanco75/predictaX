'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/stores/app-store';
import { getSitePerformance } from '@/lib/api/admin';
import { Activity, AlertTriangle, Clock, Zap, Server } from 'lucide-react';

interface Performance {
  summary: {
    total_requests: number;
    errors_4xx: number;
    errors_5xx: number;
    error_rate: number;
    avg_response_ms: number;
    p50_ms: number;
    p95_ms: number;
    p99_ms: number;
  };
  slowest_endpoints: { endpoint: string; avg_ms: number; count: number }[];
  most_hit_endpoints: { endpoint: string; count: number; avg_ms: number }[];
  daily: { date: string; total: number; errors: number }[];
}

function LatencyBadge({ ms }: { ms: number }) {
  const color = ms > 1000 ? 'text-red-500' : ms > 500 ? 'text-yellow-500' : 'text-green-500';
  return <span className={`font-mono font-medium ${color}`}>{ms}ms</span>;
}

export default function AdminPerformancePage() {
  const { user } = useAppStore();
  const [data, setData] = useState<Performance | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.token) return;
    getSitePerformance(user.token, 7)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));

    const interval = setInterval(() => {
      if (user?.token)
        getSitePerformance(user.token, 7)
          .then(setData)
          .catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, [user?.token]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-gray-200 dark:bg-gray-800 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;
  const s = data.summary;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Performance</h1>
        <p className="text-gray-500 text-sm">Métricas de rendimiento de la API (últimos 7 días)</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Server className="h-4 w-4" /> Total Requests
          </div>
          <div className="text-2xl font-bold">{s.total_requests.toLocaleString()}</div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <AlertTriangle className="h-4 w-4" /> Error Rate
          </div>
          <div
            className={`text-2xl font-bold ${s.error_rate > 5 ? 'text-red-500' : s.error_rate > 1 ? 'text-yellow-500' : 'text-green-500'}`}
          >
            {s.error_rate}%
          </div>
          <div className="text-xs text-gray-400">
            {s.errors_4xx} 4xx / {s.errors_5xx} 5xx
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Clock className="h-4 w-4" /> Avg Response
          </div>
          <div className="text-2xl font-bold">
            <LatencyBadge ms={s.avg_response_ms} />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Zap className="h-4 w-4" /> Percentiles
          </div>
          <div className="text-sm space-y-0.5 mt-1">
            <div className="flex justify-between">
              <span className="text-gray-400">p50</span> <LatencyBadge ms={s.p50_ms} />
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">p95</span> <LatencyBadge ms={s.p95_ms} />
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">p99</span> <LatencyBadge ms={s.p99_ms} />
            </div>
          </div>
        </div>
      </div>

      {/* Two column: slowest + most hit */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-red-500" /> Endpoints Más Lentos
          </h3>
          <div className="space-y-2">
            {data.slowest_endpoints.map((e, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400 font-mono text-xs truncate max-w-[300px]">
                  {e.endpoint}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-gray-400 text-xs">{e.count}x</span>
                  <LatencyBadge ms={e.avg_ms} />
                </div>
              </div>
            ))}
            {data.slowest_endpoints.length === 0 && (
              <p className="text-gray-400 text-sm">Sin datos aún</p>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Activity className="h-4 w-4 text-blue-500" /> Endpoints Más Utilizados
          </h3>
          <div className="space-y-2">
            {data.most_hit_endpoints.map((e, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400 font-mono text-xs truncate max-w-[300px]">
                  {e.endpoint}
                </span>
                <div className="flex items-center gap-3">
                  <span className="font-medium">{e.count.toLocaleString()}</span>
                  <span className="text-gray-400 text-xs">{e.avg_ms}ms</span>
                </div>
              </div>
            ))}
            {data.most_hit_endpoints.length === 0 && (
              <p className="text-gray-400 text-sm">Sin datos aún</p>
            )}
          </div>
        </div>
      </div>

      {/* Daily traffic chart */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
        <h3 className="text-sm font-medium mb-4">Requests por Día</h3>
        {data.daily.length === 0 ? (
          <p className="text-gray-400 text-center py-12">Sin datos de tráfico aún</p>
        ) : (
          <div className="flex items-end gap-1 h-40">
            {data.daily.map((d) => {
              const maxTotal = Math.max(...data.daily.map((x) => x.total), 1);
              const height = (d.total / maxTotal) * 100;
              const errorPercent = d.total > 0 ? (d.errors / d.total) * 100 : 0;
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
                      style={{ height: `${100 - errorPercent}%` }}
                    />
                    <div className="bg-red-500 w-full" style={{ height: `${errorPercent}%` }} />
                  </div>
                  <span className="text-[9px] text-gray-400 -rotate-45 origin-top-left whitespace-nowrap">
                    {new Date(d.date).toLocaleDateString('es-AR', {
                      day: '2-digit',
                      month: '2-digit',
                    })}
                  </span>
                  <div className="absolute bottom-full mb-2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                    {d.total} requests / {d.errors} errors
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div className="flex gap-4 mt-3 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-blue-500 rounded" /> OK
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-red-500 rounded" /> Errors
          </span>
        </div>
      </div>
    </div>
  );
}

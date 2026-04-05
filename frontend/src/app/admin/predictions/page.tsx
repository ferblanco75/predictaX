'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/stores/app-store';
import { getPredictionsDaily } from '@/lib/api/admin';
import { BarChart3 } from 'lucide-react';

interface DailyData {
  date: string;
  count: number;
  volume: number;
}

export default function AdminPredictionsPage() {
  const { user } = useAppStore();
  const [daily, setDaily] = useState<DailyData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.token) return;
    getPredictionsDaily(user.token, 30)
      .then(setDaily)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.token]);

  const totalPredictions = daily.reduce((a, d) => a + d.count, 0);
  const totalVolume = daily.reduce((a, d) => a + d.volume, 0);
  const maxCount = Math.max(...daily.map((d) => d.count), 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Predicciones</h1>
        <p className="text-gray-500 text-sm">Actividad de predicciones en los últimos 30 días</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <span className="text-sm text-gray-500">Total Predicciones (30d)</span>
          <div className="text-2xl font-bold mt-1">{totalPredictions}</div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <span className="text-sm text-gray-500">Volumen Total (30d)</span>
          <div className="text-2xl font-bold mt-1">${totalVolume.toLocaleString()}</div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <span className="text-sm text-gray-500">Promedio Diario</span>
          <div className="text-2xl font-bold mt-1">
            {daily.length > 0 ? Math.round(totalPredictions / daily.length) : 0}
          </div>
        </div>
      </div>

      {/* Bar chart */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
        <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-purple-500" />
          Predicciones por Día
        </h3>
        {loading ? (
          <div className="h-48 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
        ) : daily.length === 0 ? (
          <p className="text-gray-400 text-center py-12">No hay datos de predicciones aún</p>
        ) : (
          <div className="flex items-end gap-1 h-48">
            {daily.map((d) => (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group relative">
                <div
                  className="w-full bg-purple-500 rounded-t hover:bg-purple-400 transition-colors min-h-[2px]"
                  style={{ height: `${(d.count / maxCount) * 100}%` }}
                />
                <span className="text-[9px] text-gray-400 -rotate-45 origin-top-left whitespace-nowrap">
                  {new Date(d.date).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}
                </span>
                {/* Tooltip */}
                <div className="absolute bottom-full mb-2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                  {d.count} predicciones / ${d.volume.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

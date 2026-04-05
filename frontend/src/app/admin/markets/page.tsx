'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/stores/app-store';
import { getMarketsRanking } from '@/lib/api/admin';
import { Flame, Snowflake, DollarSign, Users } from 'lucide-react';

interface MarketRanking {
  id: string;
  title: string;
  category: string;
  probability: number;
  predictions_count: number;
  volume: number;
  participants: number;
  end_date: string;
}

const sortOptions = [
  { value: 'most_active', label: 'Mas activo', icon: Flame },
  { value: 'least_active', label: 'Menos activo', icon: Snowflake },
  { value: 'most_volume', label: 'Mayor volumen', icon: DollarSign },
  { value: 'most_participants', label: 'Mas participantes', icon: Users },
];

const categoryColors: Record<string, string> = {
  economia: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400',
  politica: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
  deportes: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  tecnologia: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-400',
  crypto: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400',
};

export default function AdminMarketsPage() {
  const { user } = useAppStore();
  const [markets, setMarkets] = useState<MarketRanking[]>([]);
  const [sort, setSort] = useState('most_active');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.token) return;
    setLoading(true);
    getMarketsRanking(user.token, sort, 50)
      .then(setMarkets)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.token, sort]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mercados</h1>
        <p className="text-gray-500 text-sm">Ranking y estadísticas de mercados activos</p>
      </div>

      {/* Sort buttons */}
      <div className="flex gap-2 flex-wrap">
        {sortOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setSort(opt.value)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              sort === opt.value
                ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-950'
            }`}
          >
            <opt.icon className="h-4 w-4" />
            {opt.label}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950">
              <th className="text-left px-4 py-3 font-medium text-gray-500">#</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Mercado</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Categoría</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500">Prob.</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500">Predicciones</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500">Volumen</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500">Participantes</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Cierre</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-gray-100 dark:border-gray-800">
                  {Array.from({ length: 8 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              markets.map((m, i) => (
                <tr key={m.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-950">
                  <td className="px-4 py-3 text-gray-400 font-medium">{i + 1}</td>
                  <td className="px-4 py-3 font-medium max-w-xs truncate">{m.title}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${categoryColors[m.category] || ''}`}>
                      {m.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium">{m.probability}%</td>
                  <td className="px-4 py-3 text-right">{m.predictions_count}</td>
                  <td className="px-4 py-3 text-right">${m.volume.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">{m.participants}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(m.end_date).toLocaleDateString('es-AR')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

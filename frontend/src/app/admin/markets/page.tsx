'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/stores/app-store';
import { getMarketsRanking, resolveMarket, cancelMarket, editMarket } from '@/lib/api/admin';
import {
  Flame,
  Snowflake,
  DollarSign,
  Users,
  MoreVertical,
  CheckCircle,
  XCircle,
  Pencil,
} from 'lucide-react';

interface MarketRanking {
  id: string;
  title: string;
  category: string;
  probability: number;
  predictions_count: number;
  volume: number;
  participants: number;
  end_date: string;
  status?: string;
}

interface ResolveModalState {
  open: boolean;
  marketId: string;
  title: string;
}
interface EditModalState {
  open: boolean;
  marketId: string;
  title: string;
  description: string;
}

const sortOptions = [
  { value: 'most_active', label: 'Más activo', icon: Flame },
  { value: 'least_active', label: 'Menos activo', icon: Snowflake },
  { value: 'most_volume', label: 'Mayor volumen', icon: DollarSign },
  { value: 'most_participants', label: 'Más participantes', icon: Users },
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
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [resolveModal, setResolveModal] = useState<ResolveModalState>({
    open: false,
    marketId: '',
    title: '',
  });
  const [editModal, setEditModal] = useState<EditModalState>({
    open: false,
    marketId: '',
    title: '',
    description: '',
  });

  useEffect(() => {
    if (!user?.token) return;
    setLoading(true);
    getMarketsRanking(user.token, sort, 50)
      .then(setMarkets)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.token, sort]);

  const handleResolve = async (resolutionValue: boolean) => {
    if (!user?.token) return;
    setActionLoading(resolveModal.marketId);
    setResolveModal({ open: false, marketId: '', title: '' });
    try {
      const updated = await resolveMarket(user.token, resolveModal.marketId, resolutionValue);
      setMarkets((prev) =>
        prev.map((m) => (m.id === updated.id ? { ...m, status: updated.status } : m))
      );
    } catch {
      /* silent */
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (marketId: string) => {
    if (!user?.token) return;
    setActionLoading(marketId);
    setOpenMenu(null);
    try {
      const updated = await cancelMarket(user.token, marketId);
      setMarkets((prev) =>
        prev.map((m) => (m.id === updated.id ? { ...m, status: updated.status } : m))
      );
    } catch {
      /* silent */
    } finally {
      setActionLoading(null);
    }
  };

  const handleEditSave = async () => {
    if (!user?.token) return;
    setActionLoading(editModal.marketId);
    try {
      const updated = await editMarket(user.token, editModal.marketId, {
        title: editModal.title,
        description: editModal.description,
      });
      setMarkets((prev) =>
        prev.map((m) => (m.id === updated.id ? { ...m, title: updated.title } : m))
      );
      setEditModal({ open: false, marketId: '', title: '', description: '' });
    } catch {
      /* silent */
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6" onClick={() => setOpenMenu(null)}>
      <div>
        <h1 className="text-2xl font-bold">Mercados</h1>
        <p className="text-gray-500 text-sm">Ranking y gestión de mercados</p>
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
              <th className="text-left px-4 py-3 font-medium text-gray-500">Estado</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500">Prob.</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500">Predicciones</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500">Volumen</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500">Participantes</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Cierre</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-100 dark:border-gray-800">
                    {Array.from({ length: 10 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              : markets.map((m, i) => {
                  const isActive = !m.status || m.status === 'active';
                  return (
                    <tr
                      key={m.id}
                      className={`border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-950 transition-colors ${!isActive ? 'opacity-60' : ''}`}
                    >
                      <td className="px-4 py-3 text-gray-400 font-medium">{i + 1}</td>
                      <td className="px-4 py-3 font-medium max-w-xs">
                        <span className="line-clamp-2">{m.title}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${categoryColors[m.category] || ''}`}
                        >
                          {m.category}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            m.status === 'resolved'
                              ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400'
                              : m.status === 'cancelled'
                                ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
                                : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400'
                          }`}
                        >
                          {m.status === 'resolved'
                            ? 'Resuelto'
                            : m.status === 'cancelled'
                              ? 'Cancelado'
                              : 'Activo'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">{m.probability}%</td>
                      <td className="px-4 py-3 text-right">{m.predictions_count}</td>
                      <td className="px-4 py-3 text-right">${m.volume.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">{m.participants}</td>
                      <td className="px-4 py-3 text-gray-500">
                        {new Date(m.end_date).toLocaleDateString('es-AR')}
                      </td>
                      <td className="px-4 py-3 relative">
                        <button
                          disabled={actionLoading === m.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenu(openMenu === m.id ? null : m.id);
                          }}
                          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-40"
                        >
                          {actionLoading === m.id ? (
                            <span className="h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin inline-block" />
                          ) : (
                            <MoreVertical className="h-4 w-4 text-gray-400" />
                          )}
                        </button>
                        {openMenu === m.id && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-0 top-full mt-1 w-52 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 py-1"
                          >
                            <button
                              onClick={() => {
                                setEditModal({
                                  open: true,
                                  marketId: m.id,
                                  title: m.title,
                                  description: '',
                                });
                                setOpenMenu(null);
                              }}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            >
                              <Pencil className="h-4 w-4 text-gray-500" />
                              <span>Editar título</span>
                            </button>
                            {isActive && (
                              <>
                                <button
                                  onClick={() => {
                                    setResolveModal({ open: true, marketId: m.id, title: m.title });
                                    setOpenMenu(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                >
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                  <span className="text-green-600">Resolver mercado</span>
                                </button>
                                <button
                                  onClick={() => handleCancel(m.id)}
                                  className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                >
                                  <XCircle className="h-4 w-4 text-red-500" />
                                  <span className="text-red-600">Cancelar mercado</span>
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
          </tbody>
        </table>
      </div>

      {/* Resolve Modal */}
      {resolveModal.open && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setResolveModal({ open: false, marketId: '', title: '' })}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 w-96 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold mb-1">Resolver mercado</h3>
            <p className="text-sm text-gray-500 mb-5 line-clamp-2">{resolveModal.title}</p>
            <p className="text-sm font-medium mb-3">¿Cuál es el resultado?</p>
            <div className="flex gap-3">
              <button
                onClick={() => handleResolve(true)}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 font-medium hover:bg-green-100 dark:hover:bg-green-900 transition-colors"
              >
                <CheckCircle className="h-5 w-5" /> SÍ
              </button>
              <button
                onClick={() => handleResolve(false)}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 font-medium hover:bg-red-100 dark:hover:bg-red-900 transition-colors"
              >
                <XCircle className="h-5 w-5" /> NO
              </button>
            </div>
            <button
              onClick={() => setResolveModal({ open: false, marketId: '', title: '' })}
              className="w-full mt-3 py-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal.open && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setEditModal({ open: false, marketId: '', title: '', description: '' })}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 w-96 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold mb-4">Editar mercado</h3>
            <label className="block text-sm font-medium mb-1">Título</label>
            <input
              type="text"
              value={editModal.title}
              onChange={(e) => setEditModal((prev) => ({ ...prev, title: e.target.value }))}
              className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 mb-4"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() =>
                  setEditModal({ open: false, marketId: '', title: '', description: '' })
                }
                className="px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleEditSave}
                disabled={actionLoading === editModal.marketId}
                className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {actionLoading === editModal.marketId ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

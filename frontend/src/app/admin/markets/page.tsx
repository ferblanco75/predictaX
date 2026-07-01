'use client';

import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '@/lib/stores/app-store';
import { useAdminToken } from '@/lib/hooks/useAdminToken';
import {
  AdminConfirmModal,
  AdminEmptyState,
  AdminErrorState,
  AdminNotice,
} from '@/components/admin/AdminState';
import { getMarketsRanking, resolveMarket, cancelMarket, editMarket, createMarket, deleteMarket, expirePastMarkets, unresolveMarket } from '@/lib/api/admin';
import {
  Flame,
  Snowflake,
  Coins,
  Users,
  MoreVertical,
  CheckCircle,
  XCircle,
  Pencil,
  Plus,
  Trash2,
  Clock,
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
  category: string;
  end_date: string;
}

interface CreateModalState {
  open: boolean;
  title: string;
  description: string;
  category: string;
  type: string;
  end_date: string;
  probability: number;
}

const EMPTY_CREATE: CreateModalState = {
  open: false,
  title: '',
  description: '',
  category: 'mundial',
  type: 'binary',
  end_date: '',
  probability: 50,
};

interface NoticeState {
  variant: 'success' | 'error' | 'info';
  title: string;
  message?: string;
}

interface ConfirmActionState {
  title: string;
  description: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => Promise<void>;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Ocurrió un error inesperado.';
}

const sortOptions = [
  { value: 'most_active', label: 'Más activo', icon: Flame },
  { value: 'least_active', label: 'Menos activo', icon: Snowflake },
  { value: 'most_volume', label: 'Mayor volumen', icon: Coins },
  { value: 'most_participants', label: 'Más participantes', icon: Users },
];

const categoryColors: Record<string, string> = {
  economia: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400',
  politica: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
  deportes: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  tecnologia: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-400',
  crypto: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400',
  mundial: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-400',
};

export default function AdminMarketsPage() {
  const { user } = useAppStore();
  const token = useAdminToken();
  const [markets, setMarkets] = useState<MarketRanking[]>([]);
  const [sort, setSort] = useState('most_active');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [notice, setNotice] = useState<NoticeState | null>(null);
  const [modalNotice, setModalNotice] = useState<NoticeState | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmActionState | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'resolved' | 'cancelled'>('all');
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
    category: '',
    end_date: '',
  });
  const [createModal, setCreateModal] = useState<CreateModalState>(EMPTY_CREATE);

  const loadMarkets = async () => {
    if (!token) return;
    setLoading(true);
    setLoadError('');
    try {
      const ranking = await getMarketsRanking(token, sort, 50);
      setMarkets(ranking);
    } catch (error) {
      setLoadError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadMarkets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, sort]);

  const handleResolve = async (resolutionValue: boolean) => {
    if (!token) return;
    setActionLoading(resolveModal.marketId);
    setResolveModal({ open: false, marketId: '', title: '' });
    try {
      const updated = await resolveMarket(token, resolveModal.marketId, resolutionValue);
      setMarkets((prev) =>
        prev.map((m) => (m.id === updated.id ? { ...m, status: updated.status } : m))
      );
      setNotice({
        variant: 'success',
        title: 'Mercado resuelto',
        message: `${resolutionValue ? 'SÍ' : 'NO'} · ${updated.winners ?? 0} ganadores · ${updated.total_paid_pts?.toLocaleString() ?? 0} pts pagados`,
      });
    } catch (error) {
      setNotice({ variant: 'error', title: 'No se pudo resolver el mercado', message: getErrorMessage(error) });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (marketId: string, title: string, predictionsCount: number) => {
    if (!token) return;
    setActionLoading(marketId);
    setOpenMenu(null);
    setConfirmAction(null);
    try {
      await deleteMarket(token, marketId);
      setMarkets((prev) => prev.filter((m) => m.id !== marketId));
      setNotice({ variant: 'success', title: 'Mercado eliminado', message: `"${title}" y ${predictionsCount} predicciones eliminadas.` });
    } catch (error) {
      setNotice({ variant: 'error', title: 'No se pudo eliminar', message: getErrorMessage(error) });
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnresolve = async (marketId: string, title: string) => {
    if (!token) return;
    setActionLoading(marketId);
    setOpenMenu(null);
    setConfirmAction(null);
    try {
      const res = await unresolveMarket(token, marketId);
      setMarkets((prev) => prev.map((m) => m.id === marketId ? { ...m, status: 'active' } : m));
      setNotice({
        variant: 'success',
        title: 'Resolución revertida',
        message: `"${title}" vuelve a activo · ${res.reverted_predictions} predicciones revertidas · ${res.points_adjusted?.toLocaleString() ?? 0} pts ajustados`,
      });
    } catch (error) {
      setNotice({ variant: 'error', title: 'No se pudo revertir', message: getErrorMessage(error) });
    } finally {
      setActionLoading(null);
    }
  };

  const requestUnresolve = (market: MarketRanking) => {
    setOpenMenu(null);
    setConfirmAction({
      title: 'Revertir resolución',
      description: `Vas a revertir "${market.title}". Los puntos pagados a ganadores serán descontados y todas las predicciones vuelven a "pendiente".`,
      confirmLabel: 'Revertir',
      danger: true,
      onConfirm: () => handleUnresolve(market.id, market.title),
    });
  };

  const requestDelete = (market: MarketRanking) => {
    setOpenMenu(null);
    setConfirmAction({
      title: 'Eliminar mercado',
      description: `Vas a eliminar "${market.title}" y todas sus predicciones. Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar',
      danger: true,
      onConfirm: () => handleDelete(market.id, market.title, market.predictions_count),
    });
  };

  const handleCreateSave = async () => {
    if (!token) return;
    if (!createModal.title.trim()) {
      setModalNotice({ variant: 'error', title: 'El título es requerido', message: '' }); return;
    }
    if (createModal.title.trim().length < 10) {
      setModalNotice({ variant: 'error', title: 'Título muy corto', message: 'El título debe tener al menos 10 caracteres.' }); return;
    }
    if (!createModal.description.trim() || createModal.description.trim().length < 50) {
      setModalNotice({ variant: 'error', title: 'Descripción muy corta', message: 'La descripción debe tener al menos 50 caracteres.' }); return;
    }
    if (!createModal.end_date || new Date(createModal.end_date) <= new Date()) {
      setModalNotice({ variant: 'error', title: 'Fecha inválida', message: 'La fecha de cierre debe ser posterior a ahora' }); return;
    }
    if (new Date(createModal.end_date).getFullYear() > new Date().getFullYear() + 10) {
      setModalNotice({ variant: 'error', title: 'Año inválido', message: 'El año de cierre no puede ser mayor a 10 años en el futuro.' }); return;
    }
    if (createModal.probability < 1 || createModal.probability > 99) {
      setModalNotice({ variant: 'error', title: 'Probabilidad inválida', message: 'Debe estar entre 1% y 99%' }); return;
    }
    setModalNotice(null);
    setActionLoading('creating');
    try {
      const created = await createMarket(token, {
        title: createModal.title,
        description: createModal.description,
        category: createModal.category,
        type: createModal.type,
        end_date: new Date(createModal.end_date).toISOString(),
        probability: createModal.probability,
      });
      setMarkets((prev) => [{ id: created.id, title: created.title, category: created.category, probability: created.probability, predictions_count: 0, volume: 0, participants: 0, end_date: created.end_date, status: 'active' }, ...prev]);
      setCreateModal(EMPTY_CREATE);
      setNotice({ variant: 'success', title: 'Poll creado', message: created.title });
    } catch (error) {
      setModalNotice({ variant: 'error', title: 'No se pudo crear el mercado', message: getErrorMessage(error) });
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (marketId: string, title: string) => {
    if (!token) return;
    setActionLoading(marketId);
    setOpenMenu(null);
    setConfirmAction(null);
    try {
      const updated = await cancelMarket(token, marketId);
      setMarkets((prev) =>
        prev.map((m) => (m.id === updated.id ? { ...m, status: updated.status } : m))
      );
      setNotice({
        variant: 'success',
        title: 'Mercado cancelado',
        message: title,
      });
    } catch (error) {
      setNotice({
        variant: 'error',
        title: 'No se pudo cancelar el mercado',
        message: getErrorMessage(error),
      });
    } finally {
      setActionLoading(null);
    }
  };

  const requestCancel = (market: MarketRanking) => {
    setOpenMenu(null);
    setConfirmAction({
      title: 'Cancelar mercado',
      description: `Vas a cancelar "${market.title}". El mercado dejará de aceptar nuevas predicciones.`,
      confirmLabel: 'Cancelar mercado',
      danger: true,
      onConfirm: () => handleCancel(market.id, market.title),
    });
  };

  const handleEditSave = async () => {
    if (!token) return;
    if (editModal.end_date && new Date(editModal.end_date).getFullYear() > new Date().getFullYear() + 10) {
      setModalNotice({ variant: 'error', title: 'Año inválido', message: 'El año de cierre no puede ser mayor a 10 años en el futuro.' }); return;
    }
    setModalNotice(null);
    setActionLoading(editModal.marketId);
    try {
      const updated = await editMarket(token, editModal.marketId, {
        title: editModal.title,
        description: editModal.description,
        category: editModal.category || undefined,
        end_date: editModal.end_date ? new Date(editModal.end_date).toISOString() : undefined,
      });
      setMarkets((prev) =>
        prev.map((m) =>
          m.id === updated.id
            ? { ...m, title: updated.title, category: updated.category ?? m.category, end_date: updated.end_date ?? m.end_date }
            : m
        )
      );
      setEditModal({ open: false, marketId: '', title: '', description: '', category: '', end_date: '' });
      setNotice({
        variant: 'success',
        title: 'Mercado actualizado',
        message: updated.title,
      });
    } catch (error) {
      setModalNotice({
        variant: 'error',
        title: 'No se pudo actualizar el mercado',
        message: getErrorMessage(error),
      });
    } finally {
      setActionLoading(null);
    }
  };

  const filteredMarkets = statusFilter === 'all'
    ? markets
    : markets.filter((m) => (m.status || 'active') === statusFilter);

  return (
    <div className="space-y-6" onClick={() => setOpenMenu(null)}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mercados</h1>
          <p className="text-gray-500 text-sm">Ranking y gestión de polls</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={async (e) => {
              e.stopPropagation();
              if (!token) return;
              try {
                const res = await expirePastMarkets(token);
                setNotice({ variant: 'success', title: 'Vencidos expirados', message: res.message });
                void loadMarkets();
              } catch (error) {
                setNotice({ variant: 'error', title: 'Error', message: getErrorMessage(error) });
              }
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 text-sm font-medium hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors"
          >
            <Clock className="h-4 w-4" />
            Expirar vencidos
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setModalNotice(null); setCreateModal({ ...EMPTY_CREATE, open: true }); }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Crear poll
          </button>
        </div>
      </div>

      {notice && (
        <AdminNotice
          variant={notice.variant}
          title={notice.title}
          message={notice.message}
          onDismiss={() => setNotice(null)}
        />
      )}

      {/* Sort + status filters */}
      <div className="flex flex-wrap gap-2 items-center justify-between">
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
        <div className="flex gap-1">
          {(['all', 'active', 'resolved', 'cancelled'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === s
                  ? 'bg-gray-800 dark:bg-gray-100 text-white dark:text-gray-900'
                  : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              {{ all: 'Todos', active: 'Activos', resolved: 'Resueltos', cancelled: 'Cancelados' }[s]}
            </button>
          ))}
        </div>
      </div>

      {loadError && !loading ? (
        <AdminErrorState
          title="No se pudieron cargar mercados"
          message={loadError}
          onAction={loadMarkets}
        />
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-x-auto">
          <table className="w-full min-w-[1020px] text-sm">
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
                : filteredMarkets.map((m, i) => {
                    const isActive = !m.status || m.status === 'active';
                    return (
                      <tr
                        key={m.id}
                        className={`border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-950 transition-colors ${!isActive ? 'text-gray-400 dark:text-gray-500' : ''}`}
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
                        <td className="px-4 py-3 text-right">{m.volume.toLocaleString()} pts</td>
                        <td className="px-4 py-3 text-right">{m.participants}</td>
                        <td className="px-4 py-3 text-gray-500">
                          {new Date(m.end_date).toLocaleDateString('es-AR')}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            disabled={actionLoading === m.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (openMenu === m.id) {
                                setOpenMenu(null);
                                setMenuPos(null);
                              } else {
                                const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
                                setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
                                setOpenMenu(m.id);
                              }
                            }}
                            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-40"
                          >
                            {actionLoading === m.id ? (
                              <span className="h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin inline-block" />
                            ) : (
                              <MoreVertical className="h-4 w-4 text-gray-400" />
                            )}
                          </button>
                          {openMenu === m.id && menuPos && (
                            <div
                              ref={menuRef}
                              onClick={(e) => e.stopPropagation()}
                              style={{ position: 'fixed', top: menuPos.top, right: menuPos.right }}
                              className="w-52 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 py-1"
                            >
                              <button
                                onClick={() => {
                                  setModalNotice(null);
                                  setEditModal({
                                    open: true,
                                    marketId: m.id,
                                    title: m.title,
                                    description: '',
                                    category: m.category,
                                    end_date: m.end_date
                                      ? new Date(m.end_date).toISOString().slice(0, 16)
                                      : '',
                                  });
                                  setOpenMenu(null);
                                }}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                              >
                                <Pencil className="h-4 w-4 text-gray-500" />
                                <span>Editar título</span>
                              </button>
                              {m.status === 'resolved' && (
                                <button
                                  onClick={() => requestUnresolve(m)}
                                  className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors text-amber-600 dark:text-amber-400"
                                >
                                  <XCircle className="h-4 w-4" />
                                  Revertir resolución
                                </button>
                              )}
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
                                    onClick={() => requestCancel(m)}
                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                  >
                                    <XCircle className="h-4 w-4 text-red-500" />
                                    <span className="text-red-600">Cancelar mercado</span>
                                  </button>
                                </>
                              )}
                              <div className="border-t border-gray-100 dark:border-gray-800 my-1" />
                              <button
                                onClick={() => requestDelete(m)}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors text-red-600 dark:text-red-400"
                              >
                                <Trash2 className="h-4 w-4" />
                                Eliminar
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
          {!loading && markets.length === 0 && (
            <div className="p-6">
              <AdminEmptyState
                title="Sin mercados para mostrar"
                message="No hay mercados disponibles para el ranking seleccionado."
              />
            </div>
          )}
        </div>
      )}

      <AdminConfirmModal
        open={!!confirmAction}
        title={confirmAction?.title ?? ''}
        description={confirmAction?.description ?? ''}
        confirmLabel={confirmAction?.confirmLabel ?? 'Confirmar'}
        danger={confirmAction?.danger}
        loading={!!actionLoading}
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => {
          void confirmAction?.onConfirm();
        }}
      />

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
          onClick={() => { setModalNotice(null); setEditModal({ open: false, marketId: '', title: '', description: '', category: '', end_date: '' }); }}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 w-96 shadow-xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold mb-4">Editar mercado</h3>
            {modalNotice && (
              <div className="mb-4">
                <AdminNotice
                  variant={modalNotice.variant}
                  title={modalNotice.title}
                  message={modalNotice.message}
                  onDismiss={() => setModalNotice(null)}
                />
              </div>
            )}
            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">Título</label>
                <input
                  type="text"
                  value={editModal.title}
                  onChange={(e) => setEditModal((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Categoría</label>
                <select
                  value={editModal.category}
                  onChange={(e) => setEditModal((prev) => ({ ...prev, category: e.target.value }))}
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800"
                >
                  {['mundial', 'economia', 'politica', 'deportes', 'tecnologia', 'crypto'].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Fecha de cierre</label>
                <input
                  type="datetime-local"
                  value={editModal.end_date}
                  min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
                  max={new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16)}
                  onChange={(e) => setEditModal((prev) => ({ ...prev, end_date: e.target.value }))}
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setModalNotice(null);
                  setEditModal({ open: false, marketId: '', title: '', description: '', category: '', end_date: '' });
                }}
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

      {/* Create Modal */}
      {createModal.open && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => { setModalNotice(null); setCreateModal(EMPTY_CREATE); }}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold text-lg">Crear nuevo poll</h3>

            {modalNotice && (
              <AdminNotice
                variant={modalNotice.variant}
                title={modalNotice.title}
                message={modalNotice.message}
                onDismiss={() => setModalNotice(null)}
              />
            )}

            <div>
              <label className="block text-sm font-medium mb-1">
                Título <span className="text-gray-400 font-normal">(mín. 10 caracteres)</span>
              </label>
              <input
                type="text"
                value={createModal.title}
                onChange={(e) => setCreateModal((p) => ({ ...p, title: e.target.value }))}
                placeholder="¿Ganará Argentina el Mundial 2026?"
                className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800"
                autoFocus
              />
              <p className="text-xs text-gray-400 mt-1">{createModal.title.trim().length}/10 mín.</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Descripción <span className="text-gray-400 font-normal">(mín. 50 caracteres)</span>
              </label>
              <textarea
                value={createModal.description}
                onChange={(e) => setCreateModal((p) => ({ ...p, description: e.target.value }))}
                placeholder="Descripción y reglas de resolución del mercado..."
                rows={3}
                className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 resize-none"
              />
              <p className="text-xs text-gray-400 mt-1">{createModal.description.trim().length}/50 mín.</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Categoría</label>
                <select
                  value={createModal.category}
                  onChange={(e) => setCreateModal((p) => ({ ...p, category: e.target.value }))}
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800"
                >
                  {['mundial', 'economia', 'politica', 'deportes', 'tecnologia', 'crypto'].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tipo</label>
                <select
                  value={createModal.type}
                  onChange={(e) => setCreateModal((p) => ({ ...p, type: e.target.value }))}
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800"
                >
                  <option value="binary">Binario (Sí/No)</option>
                  <option value="multiple_choice">Múltiple opción</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Fecha de cierre</label>
                <input
                  type="datetime-local"
                  value={createModal.end_date}
                  min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
                  max={new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16)}
                  onChange={(e) => setCreateModal((p) => ({ ...p, end_date: e.target.value }))}
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Probabilidad inicial (%)</label>
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={createModal.probability}
                  onChange={(e) => setCreateModal((p) => ({ ...p, probability: Number(e.target.value) }))}
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => { setModalNotice(null); setCreateModal(EMPTY_CREATE); }}
                className="px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateSave}
                disabled={!createModal.title || !createModal.end_date || actionLoading === 'creating'}
                className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {actionLoading === 'creating' ? 'Creando...' : 'Crear poll'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

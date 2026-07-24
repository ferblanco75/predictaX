'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Trophy,
  TrendingDown,
  Clock,
  Coins,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/lib/stores/app-store';
import api from '@/lib/api/client';

interface PredictionItem {
  id: string;
  market_id: string;
  market_title: string | null;
  probability: number;
  points_wagered: number;
  potential_gain: number | null;
  status: 'pending' | 'won' | 'lost';
  created_at: string;
}

interface ProfileStats {
  total_predictions: number;
  won: number;
  lost: number;
  pending: number;
  total_wagered: number;
  total_won: number;
  total_lost: number;
  net: number;
  win_rate: number;
  first_prediction_at: string | null;
}

interface ProfileUser {
  id: string;
  username: string;
  email: string;
  points: number;
  role: string;
  created_at: string | null;
}

interface ProfileData {
  user: ProfileUser;
  stats: ProfileStats;
  predictions: PredictionItem[];
}

const STATUS_CONFIG = {
  won: {
    label: 'Ganada',
    className: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400',
  },
  lost: {
    label: 'Perdida',
    className: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
  },
  pending: {
    label: 'Pendiente',
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  },
} as const;

export default function ProfilePage() {
  const { isLoggedIn } = useAppStore();
  const router = useRouter();
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'won' | 'lost' | 'pending'>('all');
  const [limit, setLimit] = useState(20);

  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/auth');
      return;
    }
    api
      .get<ProfileData>('/users/me/profile')
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isLoggedIn, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12 max-w-4xl space-y-6">
          <div className="h-10 w-48 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
            ))}
          </div>
          <div className="h-96 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <p className="text-gray-500">No se pudo cargar el perfil.</p>
        </div>
      </div>
    );
  }

  const { user, stats, predictions } = data;
  const filtered = predictions.filter((p) => statusFilter === 'all' || p.status === statusFilter);
  const displayed = filtered.slice(0, limit);

  const memberSince = user.created_at
    ? new Date(user.created_at).toLocaleDateString('es-AR', { year: 'numeric', month: 'long' })
    : null;

  const activeSince = stats.first_prediction_at
    ? new Date(stats.first_prediction_at).toLocaleDateString('es-AR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-4xl space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">{user.username}</h1>
          <p className="text-gray-500 mt-1">
            {memberSince && <>Miembro desde {memberSince}</>}
            {user.role === 'admin' && (
              <Badge
                variant="secondary"
                className="ml-2 bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400"
              >
                Admin
              </Badge>
            )}
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <Coins className="h-7 w-7 mx-auto mb-2 text-amber-500" />
              <p className="text-2xl font-bold">
                {Math.round(user.points).toLocaleString('es-AR')}
              </p>
              <p className="text-xs text-gray-500 mt-1">Puntos actuales</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Target className="h-7 w-7 mx-auto mb-2 text-blue-600 dark:text-blue-400" />
              <p className="text-2xl font-bold">{stats.total_predictions}</p>
              <p className="text-xs text-gray-500 mt-1">Predicciones</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Trophy className="h-7 w-7 mx-auto mb-2 text-green-600 dark:text-green-400" />
              <p className="text-2xl font-bold">{stats.win_rate}%</p>
              <p className="text-xs text-gray-500 mt-1">Win rate</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              {stats.net >= 0 ? (
                <ArrowUpRight className="h-7 w-7 mx-auto mb-2 text-green-600 dark:text-green-400" />
              ) : (
                <ArrowDownRight className="h-7 w-7 mx-auto mb-2 text-red-500" />
              )}
              <p
                className={`text-2xl font-bold ${stats.net >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}
              >
                {stats.net >= 0 ? '+' : ''}
                {Math.round(stats.net).toLocaleString('es-AR')}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {activeSince ? `Neto desde ${activeSince}` : 'Balance neto'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-5 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Ganadas</p>
                <p className="text-xl font-bold text-green-600 dark:text-green-400">{stats.won}</p>
              </div>
              <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                +{Math.round(stats.total_won).toLocaleString('es-AR')} pts
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Perdidas</p>
                <p className="text-xl font-bold text-red-500">{stats.lost}</p>
              </div>
              <p className="text-sm font-semibold text-red-500">
                -{Math.round(stats.total_lost).toLocaleString('es-AR')} pts
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pendientes</p>
                <p className="text-xl font-bold text-amber-600 dark:text-amber-400">
                  {stats.pending}
                </p>
              </div>
              <p className="text-sm font-semibold text-gray-500">
                {Math.round(stats.total_wagered).toLocaleString('es-AR')} apostados
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Prediction history */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-lg">Historial de predicciones</CardTitle>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <div className="flex gap-1">
                  {(['all', 'won', 'lost', 'pending'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setStatusFilter(s);
                        setLimit(20);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors min-h-[32px] ${
                        statusFilter === s
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      {s === 'all'
                        ? 'Todas'
                        : s === 'won'
                          ? 'Ganadas'
                          : s === 'lost'
                            ? 'Perdidas'
                            : 'Pendientes'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {displayed.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Clock className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">
                  {statusFilter === 'all'
                    ? 'Todavía no hiciste predicciones.'
                    : `No tenés predicciones ${statusFilter === 'won' ? 'ganadas' : statusFilter === 'lost' ? 'perdidas' : 'pendientes'}.`}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {displayed.map((p) => {
                  const cfg = STATUS_CONFIG[p.status];
                  const date = new Date(p.created_at).toLocaleDateString('es-AR', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  });
                  return (
                    <Link
                      key={p.id}
                      href={`/markets/${p.market_id}`}
                      className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 dark:border-gray-800 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors group"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                          {p.market_title ?? 'Market eliminado'}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                          <span>{date}</span>
                          <span>·</span>
                          <span>{p.probability}%</span>
                          <span>·</span>
                          <span>{p.points_wagered} pts apostados</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {p.status === 'won' && p.potential_gain != null && (
                          <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                            +{Math.round(p.points_wagered + p.potential_gain)} pts
                          </span>
                        )}
                        {p.status === 'lost' && (
                          <span className="text-sm font-semibold text-red-500">
                            -{p.points_wagered} pts
                          </span>
                        )}
                        {p.status === 'pending' && p.potential_gain != null && (
                          <span className="text-sm text-amber-600 dark:text-amber-400">
                            ≈ +{Math.round(p.potential_gain)} pts
                          </span>
                        )}
                        <Badge variant="secondary" className={cfg.className}>
                          {cfg.label}
                        </Badge>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            {filtered.length > limit && (
              <button
                onClick={() => setLimit((l) => l + 20)}
                className="mt-4 w-full py-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Mostrar más ({filtered.length - limit} restantes)
              </button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/stores/app-store';
import { getUsers, getTopActiveUsers, getInactiveUsers, getUserEngagement } from '@/lib/api/admin';
import { Search, Shield, User as UserIcon, Trophy, UserX, Clock } from 'lucide-react';

interface UserData {
  id: string; email: string; username: string; role: string;
  points: number; is_active: boolean; predictions_count: number; created_at: string;
}

interface TopUser {
  id: string; username: string; email: string;
  predictions_count: number; total_wagered: number; points: number;
}

interface InactiveUser {
  id: string; username: string; email: string;
  points: number; total_predictions: number; created_at: string;
}

interface Engagement {
  by_hour: { hour: number; count: number }[];
  by_day_of_week: { day: string; count: number }[];
}

type Tab = 'all' | 'top' | 'inactive' | 'engagement';

export default function AdminUsersPage() {
  const { user } = useAppStore();
  const [tab, setTab] = useState<Tab>('all');
  const [users, setUsers] = useState<UserData[]>([]);
  const [total, setTotal] = useState(0);
  const [topUsers, setTopUsers] = useState<TopUser[]>([]);
  const [inactiveUsers, setInactiveUsers] = useState<InactiveUser[]>([]);
  const [engagement, setEngagement] = useState<Engagement | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.token) return;
    setLoading(true);
    Promise.all([
      getUsers(user.token, { limit: 50 }),
      getTopActiveUsers(user.token, 30, 10),
      getInactiveUsers(user.token, 30),
      getUserEngagement(user.token, 30),
    ])
      .then(([u, top, inactive, eng]) => {
        setUsers(u.data); setTotal(u.total);
        setTopUsers(top); setInactiveUsers(inactive);
        setEngagement(eng);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.token]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.token) return;
    getUsers(user.token, { search, limit: 50 })
      .then((res) => { setUsers(res.data); setTotal(res.total); })
      .catch(() => {});
  };

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'all', label: 'Todos', icon: UserIcon },
    { id: 'top', label: 'Top Activos', icon: Trophy },
    { id: 'inactive', label: 'Inactivos', icon: UserX },
    { id: 'engagement', label: 'Engagement', icon: Clock },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Usuarios</h1>
          <p className="text-gray-500 text-sm">{total} usuarios registrados</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.id
                ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-950'
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* All Users Tab */}
      {tab === 'all' && (
        <>
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por email o username..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm w-72"
              />
            </div>
          </form>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950">
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Usuario</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Rol</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Puntos</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Predicciones</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Registro</th>
                </tr>
              </thead>
              <tbody>
                {loading ? Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-100 dark:border-gray-800">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                )) : users.map((u) => (
                  <tr key={u.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-950 transition-colors">
                    <td className="px-4 py-3 font-medium flex items-center gap-2">
                      {u.role === 'admin' ? <Shield className="h-4 w-4 text-amber-500" /> : <UserIcon className="h-4 w-4 text-gray-400" />}
                      {u.username}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        u.role === 'admin'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                      }`}>{u.role}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{u.points.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">{u.predictions_count}</td>
                    <td className="px-4 py-3 text-gray-500">{new Date(u.created_at).toLocaleDateString('es-AR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Top Active Users Tab */}
      {tab === 'top' && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-800">
            <h3 className="font-medium">Usuarios más activos (últimos 30 días)</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950">
                <th className="text-left px-4 py-3 font-medium text-gray-500">#</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Usuario</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Email</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Predicciones</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Total Apostado</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Puntos</th>
              </tr>
            </thead>
            <tbody>
              {topUsers.map((u, i) => (
                <tr key={u.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-950 transition-colors">
                  <td className="px-4 py-3">
                    <span className={`w-6 h-6 inline-flex items-center justify-center rounded-full text-xs font-bold ${
                      i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-gray-100 text-gray-600' : i === 2 ? 'bg-orange-100 text-orange-700' : 'text-gray-400'
                    }`}>{i + 1}</span>
                  </td>
                  <td className="px-4 py-3 font-medium">{u.username}</td>
                  <td className="px-4 py-3 text-gray-500">{u.email}</td>
                  <td className="px-4 py-3 text-right font-medium">{u.predictions_count}</td>
                  <td className="px-4 py-3 text-right">${u.total_wagered.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">{u.points.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {topUsers.length === 0 && <p className="text-gray-400 text-center py-8">Sin actividad en los últimos 30 días</p>}
        </div>
      )}

      {/* Inactive Users Tab */}
      {tab === 'inactive' && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-800">
            <h3 className="font-medium">Usuarios sin predicciones en 30 días</h3>
            <p className="text-xs text-gray-400 mt-1">{inactiveUsers.length} usuarios inactivos</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950">
                <th className="text-left px-4 py-3 font-medium text-gray-500">Usuario</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Email</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Puntos</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Predicciones Total</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Registro</th>
              </tr>
            </thead>
            <tbody>
              {inactiveUsers.map((u) => (
                <tr key={u.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-950 transition-colors">
                  <td className="px-4 py-3 font-medium flex items-center gap-2">
                    <UserX className="h-4 w-4 text-gray-300" />{u.username}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{u.email}</td>
                  <td className="px-4 py-3 text-right">{u.points.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">{u.total_predictions}</td>
                  <td className="px-4 py-3 text-gray-500">{new Date(u.created_at).toLocaleDateString('es-AR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {inactiveUsers.length === 0 && <p className="text-gray-400 text-center py-8">Todos los usuarios están activos</p>}
        </div>
      )}

      {/* Engagement Tab */}
      {tab === 'engagement' && engagement && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* By Hour */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
            <h3 className="text-sm font-medium mb-4">Actividad por Hora del Día</h3>
            <div className="flex items-end gap-0.5 h-40">
              {Array.from({ length: 24 }).map((_, h) => {
                const entry = engagement.by_hour.find((e) => e.hour === h);
                const count = entry?.count || 0;
                const maxCount = Math.max(...engagement.by_hour.map((e) => e.count), 1);
                const height = (count / maxCount) * 100;
                return (
                  <div key={h} className="flex-1 flex flex-col items-center gap-1 group relative">
                    <div
                      className="w-full bg-blue-500 rounded-t hover:bg-blue-400 transition-colors min-h-[1px]"
                      style={{ height: `${height}%` }}
                    />
                    {h % 3 === 0 && (
                      <span className="text-[9px] text-gray-400">{h}h</span>
                    )}
                    <div className="absolute bottom-full mb-2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                      {h}:00 — {count} acciones
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* By Day of Week */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
            <h3 className="text-sm font-medium mb-4">Actividad por Día de la Semana</h3>
            <div className="space-y-3">
              {engagement.by_day_of_week.map((d) => {
                const maxCount = Math.max(...engagement.by_day_of_week.map((e) => e.count), 1);
                const pct = (d.count / maxCount) * 100;
                return (
                  <div key={d.day}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{d.day}</span>
                      <span className="font-medium">{d.count}</span>
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
              {engagement.by_day_of_week.length === 0 && <p className="text-gray-400 text-sm text-center py-4">Sin datos de engagement aún</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';

import { AdminErrorState } from '@/components/admin/AdminState';
import { useAdminToken } from '@/lib/hooks/useAdminToken';
import {
  type CategoryVisibilityRow,
  getCategoriesVisibility,
  updateCategoryVisibility,
} from '@/lib/api/admin';
import { getCategoryById } from '@/lib/data/categories';

export default function AdminSettingsPage() {
  const token = useAdminToken();
  const [rows, setRows] = useState<CategoryVisibilityRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendingCategory, setPendingCategory] = useState<string | null>(null);

  const load = async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      setRows(await getCategoriesVisibility(token));
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : 'No se pudo cargar la configuración.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const toggle = async (category: string, nextVisible: boolean) => {
    if (!token) return;
    setPendingCategory(category);
    setError('');
    try {
      setRows(await updateCategoryVisibility(token, category, nextVisible));
    } catch (toggleError) {
      setError(
        toggleError instanceof Error ? toggleError.message : 'No se pudo actualizar la categoría.'
      );
    } finally {
      setPendingCategory(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded" />
        <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-xl" />
      </div>
    );
  }

  if (error && !rows) {
    return (
      <AdminErrorState title="No se pudo cargar la configuración" message={error} onAction={load} />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configuración</h1>
        <p className="text-gray-500 text-sm">
          Mostrá u ocultá categorías del sitio público. Los mercados existentes no se borran; solo
          dejan de listarse mientras la categoría esté oculta.
        </p>
      </div>

      {error && <AdminErrorState title="La última acción falló" message={error} onAction={load} />}

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
        {rows?.map((row) => {
          const meta = getCategoryById(row.category);
          const isPending = pendingCategory === row.category;
          return (
            <div key={row.category} className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium">{meta?.name ?? row.category}</p>
                {row.updated_at && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    Actualizado {new Date(row.updated_at).toLocaleString('es-AR')}
                  </p>
                )}
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={row.is_visible}
                disabled={isPending}
                onClick={() => toggle(row.category, !row.is_visible)}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${
                  row.is_visible ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    row.is_visible ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

'use client';

import { type FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Download, LockKeyhole, ShieldCheck, Trash2 } from 'lucide-react';

import api from '@/lib/api/client';
import { useAppStore } from '@/lib/stores/app-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

type ActionState = 'idle' | 'loading' | 'success' | 'error';

function downloadJson(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
}

export default function PrivacySettingsPage() {
  const router = useRouter();
  const { isLoggedIn, user, logout } = useAppStore();
  const [exportState, setExportState] = useState<ActionState>('idle');
  const [deleteState, setDeleteState] = useState<ActionState>('idle');
  const [deletePassword, setDeletePassword] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const messageIsSuccess = exportState === 'success' && deleteState !== 'error';

  const handleExport = async () => {
    setExportState('loading');
    setMessage(null);

    try {
      const response = await api.get('/users/me/data-export');
      const date = new Date().toISOString().slice(0, 10);
      downloadJson(response.data, `predictax-data-export-${date}.json`);
      setExportState('success');
      setMessage('Export JSON descargado correctamente.');
    } catch {
      setExportState('error');
      setMessage('No pudimos generar tu export. Volvé a intentarlo.');
    }
  };

  const handleDelete = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);

    if (!confirmDelete) {
      setDeleteState('error');
      setMessage('Confirmá que entendés que la eliminación es irreversible.');
      return;
    }

    setDeleteState('loading');

    try {
      await api.delete('/users/me', {
        data: {
          password: deletePassword,
          confirm_delete: true,
        },
      });
      localStorage.removeItem('token');
      logout();
      router.push('/');
    } catch {
      setDeleteState('error');
      setMessage('No pudimos eliminar la cuenta. Verificá tu contraseña.');
    }
  };

  if (!isLoggedIn || !user) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-12">
        <Card className="mx-auto max-w-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LockKeyhole className="h-5 w-5 text-blue-600" />
              Acceso requerido
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>Necesitás iniciar sesión para acceder a tus datos personales y preferencias.</p>
            <Link href="/auth">
              <Button>Iniciar sesión</Button>
            </Link>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 md:py-14">
      <div className="mx-auto max-w-4xl space-y-6">
        <section className="rounded-3xl bg-gradient-to-br from-slate-950 via-blue-950 to-purple-950 p-6 text-white shadow-xl md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm text-blue-100 ring-1 ring-white/20">
                <ShieldCheck className="h-4 w-4" />
                Privacidad de cuenta
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Tus datos</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">
                  Descargá una copia en JSON o solicitá la eliminación/anonymización de tu cuenta.
                </p>
              </div>
            </div>
            <div className="rounded-2xl bg-white/10 px-4 py-3 text-sm text-blue-100 ring-1 ring-white/20">
              {user.email}
            </div>
          </div>
        </section>

        {message && (
          <div
            className={`rounded-xl border px-4 py-3 text-sm ${
              messageIsSuccess
                ? 'border-green-200 bg-green-50 text-green-800'
                : 'border-amber-200 bg-amber-50 text-amber-900'
            }`}
          >
            {message}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5 text-blue-600" />
                Exportar datos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>
                Genera un archivo JSON con tu perfil, consentimientos, predicciones, activity logs
                asociados y uso de IA vinculado a tu cuenta.
              </p>
              <Button type="button" onClick={handleExport} disabled={exportState === 'loading'}>
                {exportState === 'loading' ? 'Generando export...' : 'Descargar JSON'}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-red-200 bg-red-50/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-950">
                <Trash2 className="h-5 w-5 text-red-600" />
                Eliminar cuenta
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleDelete} className="space-y-4 text-sm text-red-950">
                <div className="flex gap-2 rounded-xl border border-red-200 bg-white p-3 text-red-800">
                  <AlertTriangle className="mt-0.5 h-4 w-4 flex-none" />
                  <p>
                    Esta acción anonimiza tu email y usuario, desactiva el acceso y no se puede
                    revertir desde la aplicación.
                  </p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="delete-password" className="font-medium">
                    Confirmá tu contraseña
                  </label>
                  <Input
                    id="delete-password"
                    type="password"
                    value={deletePassword}
                    onChange={(event) => setDeletePassword(event.target.value)}
                    autoComplete="current-password"
                    required
                  />
                </div>

                <label className="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="mt-1 rounded border-red-300"
                    checked={confirmDelete}
                    onChange={(event) => setConfirmDelete(event.target.checked)}
                  />
                  Entiendo que esta accion es irreversible y quiero eliminar mi cuenta.
                </label>

                <Button
                  type="submit"
                  variant="destructive"
                  disabled={deleteState === 'loading' || deletePassword.length < 8}
                >
                  {deleteState === 'loading' ? 'Eliminando...' : 'Eliminar mi cuenta'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="pt-4 text-sm text-muted-foreground">
            Para cambiar tus preferencias de cookies, usá el enlace{' '}
            <span className="font-medium text-foreground">Preferencias de privacidad</span> en el
            footer.
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import * as Sentry from '@sentry/nextjs';
import { AlertTriangle, Home } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="es">
      <body className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-xl w-full rounded-2xl border border-red-100 bg-card p-8 text-center shadow-xl dark:border-red-950 md:p-12">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400">
            <AlertTriangle className="h-10 w-10" />
          </div>

          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-red-500">Error crítico</p>
          <h1 className="mt-3 text-3xl font-bold">No pudimos cargar PredictaX</h1>

          <p className="mt-4 text-muted-foreground">
            La aplicación encontró un problema inesperado. Reintentá cargar la página o volvé al
            inicio si el problema persiste.
          </p>

          {process.env.NODE_ENV === 'development' && (
            <div className="mt-6 mb-6 p-4 bg-red-50 rounded-lg text-left">
              <p className="text-sm font-semibold text-red-900 mb-2">Error Details:</p>
              <p className="text-sm font-mono text-red-800 break-all">{error.message}</p>
              {error.digest && <p className="text-xs text-red-600 mt-2">Digest: {error.digest}</p>}
            </div>
          )}

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => reset()}
              className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Intentar nuevamente
            </button>
            <Link
              href="/"
              className="inline-flex items-center justify-center px-6 py-3 bg-card text-card-foreground border border-border rounded-lg hover:bg-accent transition-colors"
            >
              <Home className="h-4 w-4 mr-2" />
              Volver al inicio
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}

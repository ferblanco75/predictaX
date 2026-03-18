'use client';

import { useEffect } from 'react';
import { AlertTriangle, Home } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global Error:', error);
  }, [error]);

  return (
    <html lang="es">
      <body className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-card rounded-lg shadow-lg p-12 text-center">
          <div className="text-red-500 mb-6">
            <AlertTriangle className="h-20 w-20 mx-auto" />
          </div>

          <h1 className="text-3xl font-bold mb-3">Error Crítico</h1>

          <p className="text-gray-600 mb-6">
            Lo sentimos, ocurrió un error crítico en la aplicación. Por favor, recarga la página
            o contacta al soporte si el problema persiste.
          </p>

          {process.env.NODE_ENV === 'development' && (
            <div className="mb-6 p-4 bg-red-50 rounded-lg text-left">
              <p className="text-sm font-semibold text-red-900 mb-2">Error Details:</p>
              <p className="text-sm font-mono text-red-800 break-all">{error.message}</p>
              {error.digest && (
                <p className="text-xs text-red-600 mt-2">Digest: {error.digest}</p>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => reset()}
              className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Intentar nuevamente
            </button>
            <a
              href="/"
              className="inline-flex items-center justify-center px-6 py-3 bg-card text-card-foreground border border-border rounded-lg hover:bg-accent transition-colors"
            >
              <Home className="h-4 w-4 mr-2" />
              Volver al inicio
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}

'use client';

import { useEffect } from 'react';
import { AlertTriangle, Home, RefreshCcw } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <CardContent className="p-12 text-center">
          <div className="text-red-500 mb-6">
            <AlertTriangle className="h-20 w-20 mx-auto" />
          </div>

          <h1 className="text-3xl font-bold mb-3">Oops! Algo salió mal</h1>

          <p className="text-gray-600 mb-6">
            Lo sentimos, ocurrió un error inesperado. Nuestro equipo ha sido notificado y estamos
            trabajando para solucionarlo.
          </p>

          {process.env.NODE_ENV === 'development' && (
            <div className="mb-6 p-4 bg-red-50 rounded-lg text-left">
              <p className="text-sm font-semibold text-red-900 mb-2">Error Details:</p>
              <p className="text-sm font-mono text-red-800 break-all">{error.message}</p>
              {error.digest && <p className="text-xs text-red-600 mt-2">Digest: {error.digest}</p>}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={() => reset()} size="lg">
              <RefreshCcw className="h-4 w-4 mr-2" />
              Intentar nuevamente
            </Button>
            <Link href="/" className={cn(buttonVariants({ variant: 'outline', size: 'lg' }))}>
              <Home className="h-4 w-4 mr-2" />
              Volver al inicio
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

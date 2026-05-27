'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
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
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-xl w-full border-red-100 shadow-xl dark:border-red-950">
        <CardContent className="p-8 text-center md:p-12">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400">
            <AlertTriangle className="h-10 w-10" />
          </div>

          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-red-500">Error 500</p>
          <h1 className="mt-3 text-3xl font-bold">Algo salió mal</h1>

          <p className="mt-4 text-muted-foreground">
            Estamos trabajando para solucionarlo. Podés reintentar ahora o volver al inicio sin ver
            detalles técnicos del error.
          </p>

          {process.env.NODE_ENV === 'development' && (
            <div className="mt-6 mb-6 p-4 bg-red-50 rounded-lg text-left">
              <p className="text-sm font-semibold text-red-900 mb-2">Error Details:</p>
              <p className="text-sm font-mono text-red-800 break-all">{error.message}</p>
              {error.digest && <p className="text-xs text-red-600 mt-2">Digest: {error.digest}</p>}
            </div>
          )}

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
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

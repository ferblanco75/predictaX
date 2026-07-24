'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Home, RefreshCcw, WifiOff } from 'lucide-react';

import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const RETRY_SECONDS = 30;

export default function ServiceUnavailablePage() {
  const [secondsLeft, setSecondsLeft] = useState(RETRY_SECONDS);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          window.location.reload();
          return RETRY_SECONDS;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-xl w-full border-orange-100 shadow-xl dark:border-orange-950">
        <CardContent className="p-8 text-center md:p-12">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400">
            <WifiOff className="h-10 w-10" />
          </div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-orange-600">503</p>
          <h1 className="mt-3 text-3xl font-bold">Servicio temporalmente no disponible</h1>
          <p className="mt-4 text-muted-foreground">
            No pudimos conectar con el servicio. Vamos a reintentar automáticamente en{' '}
            <span className="font-semibold text-foreground">{secondsLeft}s</span>.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button size="lg" onClick={() => window.location.reload()}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              Reintentar ahora
            </Button>
            <Link href="/" className={cn(buttonVariants({ variant: 'outline', size: 'lg' }))}>
              <Home className="mr-2 h-4 w-4" />
              Volver al inicio
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

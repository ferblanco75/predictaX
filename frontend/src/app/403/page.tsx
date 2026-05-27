import type { Metadata } from 'next';
import Link from 'next/link';
import { Home, LogIn, ShieldAlert } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Acceso denegado',
  description: 'No tenés permiso para acceder a esta página.',
  robots: { index: false, follow: false },
};

const primaryLinkClass =
  'inline-flex h-11 items-center justify-center rounded-lg bg-primary px-8 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90';
const outlineLinkClass =
  'inline-flex h-11 items-center justify-center rounded-lg border border-input bg-background px-8 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground';

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-xl w-full border-amber-100 shadow-xl dark:border-amber-950">
        <CardContent className="p-8 text-center md:p-12">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
            <ShieldAlert className="h-10 w-10" />
          </div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-amber-600">403</p>
          <h1 className="mt-3 text-3xl font-bold">No tenés permiso para acceder</h1>
          <p className="mt-4 text-muted-foreground">
            Esta sección requiere permisos adicionales. Si sos admin, iniciá sesión con la cuenta
            correcta.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/" className={primaryLinkClass}>
              <Home className="mr-2 h-4 w-4" />
              Ir al inicio
            </Link>
            <Link href="/auth" className={outlineLinkClass}>
              <LogIn className="mr-2 h-4 w-4" />
              Iniciar sesión con otra cuenta
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

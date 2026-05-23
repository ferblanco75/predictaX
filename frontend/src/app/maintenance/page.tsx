import type { Metadata } from 'next';
import Link from 'next/link';
import { Hammer, Home, Mail } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Mantenimiento',
  description: 'NeuroPredict está temporalmente en mantenimiento.',
  robots: { index: false, follow: false },
};

const primaryLinkClass =
  'inline-flex h-11 items-center justify-center rounded-lg bg-primary px-8 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90';
const outlineLinkClass =
  'inline-flex h-11 items-center justify-center rounded-lg border border-input bg-background px-8 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground';

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-emerald-950 flex items-center justify-center p-4 text-white">
      <Card className="max-w-xl w-full border-white/10 bg-white/95 shadow-2xl dark:bg-gray-950/95">
        <CardContent className="p-8 text-center md:p-12">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
            <Hammer className="h-10 w-10" />
          </div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-600">
            Mantenimiento
          </p>
          <h1 className="mt-3 text-3xl font-bold text-foreground">
            Estamos mejorando NeuroPredict
          </h1>
          <p className="mt-4 text-muted-foreground">
            Estamos realizando tareas programadas para mejorar la plataforma. Volvemos pronto.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/" className={primaryLinkClass}>
              <Home className="mr-2 h-4 w-4" />
              Ir al inicio
            </Link>
            <a href="mailto:soporte@neuropredict.io" className={outlineLinkClass}>
              <Mail className="mr-2 h-4 w-4" />
              Contactar soporte
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

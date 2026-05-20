import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, KeyRound, Mail } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { canonicalUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Recuperar contraseña',
  description: 'Opciones de recuperación de acceso para PredictaX.',
  alternates: {
    canonical: canonicalUrl('/forgot-password'),
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 px-4 py-12 dark:from-gray-950 dark:via-gray-900 dark:to-blue-950">
      <div className="mx-auto max-w-md">
        <Link
          href="/auth"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a iniciar sesión
        </Link>

        <Card className="shadow-xl">
          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
              <KeyRound className="h-7 w-7" />
            </div>
            <div>
              <CardTitle className="text-2xl">Recuperar contraseña</CardTitle>
              <p className="mt-2 text-sm text-muted-foreground">
                El reset automático todavía no está disponible en el MVP.
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-950 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-100">
              Si necesitás recuperar acceso, escribinos desde el email de tu cuenta o volvé a
              registrarte en la lista de espera para que podamos ayudarte manualmente.
            </div>

            <div className="grid gap-3">
              <Link
                href="mailto:support@neuropredict.io"
                className="inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <Mail className="h-4 w-4" />
                Contactar soporte
              </Link>
              <Link
                href="/waitlist"
                className="inline-flex h-8 w-full items-center justify-center rounded-lg border border-border bg-background px-2.5 text-sm font-medium transition-colors hover:bg-muted dark:border-input dark:bg-input/30 dark:hover:bg-input/50"
              >
                Ir a lista de espera
              </Link>
              <Link href="/auth" className="text-center text-sm text-blue-600 hover:underline">
                Ya recordé mi contraseña
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

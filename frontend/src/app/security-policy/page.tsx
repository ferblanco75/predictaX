import type { Metadata } from 'next';
import Link from 'next/link';
import { CalendarDays, Mail, ShieldCheck } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { canonicalUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Security Policy',
  description: 'Política de reporte responsable de vulnerabilidades de PredictaX.',
  alternates: {
    canonical: canonicalUrl('/security-policy'),
  },
  robots: {
    index: false,
    follow: true,
  },
};

const sections = [
  {
    title: '1. Alcance',
    content:
      'Esta política aplica a PredictaX, sus páginas públicas bajo neuropredict.io y los servicios backend operados oficialmente para el MVP. No incluye servicios de terceros, cuentas personales, infraestructura no publicada ni sistemas fuera del control directo de PredictaX.',
  },
  {
    title: '2. Cómo reportar',
    content:
      'Enviá un correo a security@neuropredict.io con una descripción clara del hallazgo, pasos de reproducción, impacto potencial, URLs afectadas y cualquier evidencia técnica útil. No incluyas datos personales de terceros salvo que sea estrictamente necesario para explicar el problema.',
  },
  {
    title: '3. Investigación responsable',
    content:
      'No realices pruebas destructivas, explotación persistente, exfiltración de datos, denegación de servicio, ingeniería social, spam, acceso a cuentas de terceros ni acciones que degraden el servicio. Si encontrás datos sensibles, detené la prueba y reportalo de inmediato.',
  },
  {
    title: '4. Tiempos de respuesta',
    content:
      'Intentaremos confirmar recepción dentro de un plazo razonable y priorizar hallazgos según severidad, impacto y reproducibilidad. Durante el MVP los tiempos pueden variar, pero los reportes críticos tendrán prioridad.',
  },
  {
    title: '5. Recompensas',
    content:
      'PredictaX todavía no opera un programa formal de bug bounty ni garantiza recompensas económicas. Los reportes válidos pueden recibir reconocimiento público si la persona investigadora lo solicita y si no compromete la seguridad del servicio.',
  },
  {
    title: '6. Coordinación de divulgación',
    content:
      'Pedimos no divulgar públicamente una vulnerabilidad hasta que exista una corrección o mitigación razonable. Si necesitás publicar una investigación, coordinemos primero una fecha responsable de divulgación.',
  },
];

export default function SecurityPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <section className="border-b bg-gradient-to-br from-slate-950 via-emerald-950 to-blue-950 text-white">
        <div className="container mx-auto px-4 py-14 md:py-20">
          <div className="max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm text-emerald-100 ring-1 ring-white/20">
              <ShieldCheck className="h-4 w-4" />
              Responsible disclosure
            </div>
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Security Policy</h1>
            <p className="mt-5 text-lg text-emerald-100">
              Canal oficial para reportar vulnerabilidades de seguridad en PredictaX durante el MVP
              Mundial 2026.
            </p>
            <div className="mt-6 flex flex-wrap gap-3 text-sm text-emerald-100">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1">
                <CalendarDays className="h-4 w-4" />
                Última actualización: 21 de mayo de 2026
              </span>
              <span className="rounded-full bg-white/10 px-3 py-1">Versión 0.1</span>
            </div>
          </div>
        </div>
      </section>

      <main className="container mx-auto px-4 py-10 md:py-14">
        <div className="mx-auto max-w-4xl space-y-6">
          <Card className="border-emerald-300 bg-emerald-50 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100">
            <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-3">
                <Mail className="mt-1 h-5 w-5 flex-none" />
                <div>
                  <p className="font-medium">Contacto de seguridad</p>
                  <p className="mt-1 text-sm leading-6">
                    Para reportes responsables, escribinos a{' '}
                    <a href="mailto:security@neuropredict.io" className="font-medium underline">
                      security@neuropredict.io
                    </a>
                    .
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {sections.map((section) => (
            <Card key={section.title}>
              <CardHeader>
                <CardTitle>{section.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="leading-7 text-muted-foreground">{section.content}</p>
              </CardContent>
            </Card>
          ))}

          <Card>
            <CardContent className="flex flex-col gap-3 pt-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <span>Este canal complementa los términos y la política de privacidad.</span>
              <div className="flex gap-4">
                <Link href="/terms" className="font-medium text-blue-600 hover:text-blue-700">
                  Términos
                </Link>
                <Link href="/privacy" className="font-medium text-blue-600 hover:text-blue-700">
                  Privacidad
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

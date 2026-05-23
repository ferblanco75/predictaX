import type { Metadata } from 'next';
import Link from 'next/link';
import { AlertTriangle, CalendarDays, ShieldCheck } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { canonicalUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Términos y Condiciones',
  description: 'Términos y condiciones de uso de NeuroPredict.',
  alternates: {
    canonical: canonicalUrl('/terms'),
  },
  robots: {
    index: false,
    follow: true,
  },
};

const sections = [
  {
    title: '1. Descripción del servicio',
    content:
      'NeuroPredict es una plataforma MVP de mercados de predicción orientada a entretenimiento, análisis y aprendizaje. Los usuarios participan con puntos virtuales en mercados sobre Mundial 2026, fútbol, economía, política, tecnología, cripto y otros temas disponibles en la plataforma.',
  },
  {
    title: '2. Elegibilidad y cuenta',
    content:
      'Para usar NeuroPredict debés tener al menos 18 años o la edad legal requerida en tu jurisdicción. Sos responsable de mantener la confidencialidad de tus credenciales y de toda actividad realizada desde tu cuenta.',
  },
  {
    title: '3. Sistema de puntos',
    content:
      'La plataforma puede asignar puntos virtuales a los usuarios para participar en predicciones. Salvo indicación expresa en contrario, estos puntos no representan dinero, no tienen valor monetario, no son transferibles fuera de NeuroPredict, no pueden canjearse por efectivo y no constituyen apuestas con dinero real.',
  },
  {
    title: '4. Predicciones y resolución de mercados',
    content:
      'Cada mercado informa su pregunta, opciones o tipo de predicción, descripción y fecha de cierre. NeuroPredict podrá resolver mercados usando fuentes públicas, proveedores de datos deportivos, revisión manual o criterios definidos en cada mercado.',
  },
  {
    title: '5. Conducta prohibida',
    content:
      'No está permitido manipular resultados, usar múltiples cuentas para obtener ventaja, automatizar abuso, intentar acceder a áreas no autorizadas, interferir con la plataforma o publicar contenido ilegal, ofensivo o engañoso.',
  },
  {
    title: '6. Información e inteligencia artificial',
    content:
      'Los análisis generados por IA, probabilidades y estadísticas mostradas son informativos. Pueden contener errores, quedar desactualizados o no contemplar todos los factores relevantes. No constituyen asesoramiento financiero, legal, deportivo, de inversión ni profesional.',
  },
  {
    title: '7. Cambios y disponibilidad',
    content:
      'NeuroPredict puede modificar funcionalidades, reglas, mercados, disponibilidad del servicio o estos términos. Cuando los cambios sean relevantes, se intentará comunicarlo por medios razonables dentro de la plataforma.',
  },
  {
    title: '8. Limitación de responsabilidad',
    content:
      'NeuroPredict se ofrece en el estado en que se encuentra, especialmente durante la etapa MVP. La plataforma no garantiza disponibilidad continua, exactitud absoluta de datos, continuidad de mercados ni resultados específicos derivados del uso del servicio.',
  },
  {
    title: '9. Contacto',
    content:
      'Para consultas sobre estos términos, escribinos a legal@neuropredict.io o al canal de contacto oficial que se publique en la plataforma.',
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <section className="border-b bg-gradient-to-br from-blue-950 via-blue-900 to-emerald-900 text-white">
        <div className="container mx-auto px-4 py-14 md:py-20">
          <div className="max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm text-blue-100 ring-1 ring-white/20">
              <ShieldCheck className="h-4 w-4" />
              Documento legal MVP
            </div>
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
              Términos y Condiciones
            </h1>
            <p className="mt-5 text-lg text-blue-100">
              Reglas básicas para usar NeuroPredict durante el lanzamiento Mundial 2026 y futuras
              experiencias de mercados de predicción.
            </p>
            <div className="mt-6 flex flex-wrap gap-3 text-sm text-blue-100">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1">
                <CalendarDays className="h-4 w-4" />
                Última actualización: 20 de mayo de 2026
              </span>
              <span className="rounded-full bg-white/10 px-3 py-1">Versión 0.1</span>
            </div>
          </div>
        </div>
      </section>

      <main className="container mx-auto px-4 py-10 md:py-14">
        <div className="mx-auto max-w-4xl space-y-6">
          <Card className="border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
            <CardContent className="flex gap-3 pt-6">
              <AlertTriangle className="mt-1 h-5 w-5 flex-none" />
              <p className="text-sm leading-6">
                Este texto es una versión inicial para MVP y debe ser revisado por un profesional
                legal antes del lanzamiento público definitivo, especialmente si en el futuro los
                puntos tienen valor monetario o premios.
              </p>
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
              <span>También podés revisar cómo tratamos tus datos personales.</span>
              <Link href="/privacy" className="font-medium text-blue-600 hover:text-blue-700">
                Ver Política de Privacidad
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';
import { AlertTriangle, CalendarDays, LockKeyhole } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { canonicalUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Política de Privacidad',
  description: 'Política de privacidad de PredictaX.',
  alternates: {
    canonical: canonicalUrl('/privacy'),
  },
  robots: {
    index: false,
    follow: true,
  },
};

const sections = [
  {
    title: '1. Datos que recolectamos',
    content:
      'Podemos recolectar email, nombre de usuario, contraseña hasheada, rol, puntos, predicciones realizadas, mercados consultados, actividad dentro de la API, dirección IP, user-agent, fecha de registro y preferencias guardadas en el navegador.',
  },
  {
    title: '2. Uso de la información',
    content:
      'Usamos estos datos para crear y proteger cuentas, permitir predicciones, calcular rankings, prevenir abuso, mejorar la experiencia, medir rendimiento, enviar comunicaciones transaccionales y operar funcionalidades de análisis con inteligencia artificial.',
  },
  {
    title: '3. Cookies, localStorage y analítica',
    content:
      'PredictaX puede usar cookies, localStorage u otras tecnologías similares para sesión, preferencias, analítica y monitoreo. El token de sesión puede almacenarse en el navegador. En producción se podrán usar Google Analytics, Vercel Analytics y Sentry según la configuración vigente.',
  },
  {
    title: '4. Proveedores externos',
    content:
      'La plataforma puede operar sobre servicios de terceros como Vercel, Render, proveedores de base de datos administrada, Google Gemini, Google Analytics, Vercel Analytics, Sentry y Resend. Estos proveedores procesan datos solo en la medida necesaria para prestar sus servicios.',
  },
  {
    title: '5. Seguridad',
    content:
      'Aplicamos medidas razonables para proteger la información, incluyendo HTTPS, hashing de contraseñas, controles de acceso, monitoreo y revisión de vulnerabilidades. Ningún sistema conectado a internet puede garantizar seguridad absoluta.',
  },
  {
    title: '6. Retención',
    content:
      'Conservamos los datos mientras la cuenta esté activa o mientras sea necesario para operar el servicio, cumplir obligaciones legales, resolver disputas, prevenir fraude o mantener registros de seguridad.',
  },
  {
    title: '7. Derechos del usuario',
    content:
      'Podés solicitar acceso, rectificación, actualización o eliminación de tus datos personales. Algunas solicitudes pueden requerir verificación de identidad y podrían estar limitadas por obligaciones legales o de seguridad.',
  },
  {
    title: '8. Menores de edad',
    content:
      'PredictaX no está dirigida a menores de 18 años. Si detectamos una cuenta creada por una persona menor de edad, podremos suspenderla o eliminarla.',
  },
  {
    title: '9. Contacto',
    content:
      'Para consultas o solicitudes sobre privacidad, escribinos a privacy@neuropredict.io o al canal de contacto oficial publicado en la plataforma.',
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <section className="border-b bg-gradient-to-br from-slate-950 via-blue-950 to-purple-950 text-white">
        <div className="container mx-auto px-4 py-14 md:py-20">
          <div className="max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm text-blue-100 ring-1 ring-white/20">
              <LockKeyhole className="h-4 w-4" />
              Privacidad y datos personales
            </div>
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
              Política de Privacidad
            </h1>
            <p className="mt-5 text-lg text-blue-100">
              Información clara sobre qué datos usa PredictaX, para qué los usa y qué derechos tenés
              sobre tu información.
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
                Esta política es una versión inicial para MVP. Debe revisarse legalmente antes del
                lanzamiento público definitivo y actualizarse cuando se confirme proveedor de base
                de datos, dominio final y configuración de analítica/cookies.
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
              <span>El uso de PredictaX también se rige por sus términos de servicio.</span>
              <Link href="/terms" className="font-medium text-blue-600 hover:text-blue-700">
                Ver Términos y Condiciones
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';
import { Brain, TrendingUp, Users, BarChart3, AlertCircle, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { canonicalUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Metodología — Cómo se forman los porcentajes',
  description:
    'Cómo NeuroPredict calcula la probabilidad de cada poll: tendencias, contexto histórico, estimación de IA y sabiduría colectiva.',
  alternates: { canonical: canonicalUrl('/metodologia') },
  openGraph: {
    title: 'Metodología — Cómo se forman los porcentajes',
    description:
      'Cómo NeuroPredict calcula la probabilidad de cada poll: tendencias, contexto histórico, estimación de IA y sabiduría colectiva.',
    url: canonicalUrl('/metodologia'),
  },
};

const STEPS = [
  {
    icon: TrendingUp,
    badge: 'Paso 1',
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    title: 'Señales de tendencia',
    body: `El punto de partida es la relevancia del tema en la conversación pública argentina. Usamos el feed oficial de Google Trends para Argentina: los temas con mayor volumen de búsquedas en un momento dado indican que hay expectativa o incertidumbre social sobre su desenlace. Cuanto más alto es el tráfico de búsquedas, más probable es que el tema genere predicciones significativas.`,
  },
  {
    icon: BarChart3,
    badge: 'Paso 2',
    color: 'text-violet-600 dark:text-violet-400',
    bg: 'bg-violet-50 dark:bg-violet-950/40',
    title: 'Contexto histórico por categoría',
    body: `Para cada categoría se aplican parámetros distintos al estimar la probabilidad inicial. En economía se consideran ciclos previos de tipo de cambio, inflación y política monetaria. En política se tienen en cuenta resultados electorales históricos, aprobación de gestión y antecedentes legislativos. En deportes se ponderan resultados recientes, condición de local o visitante y estado de forma. En tecnología y crypto se observan ciclos de adopción y volatilidad histórica del sector.`,
  },
  {
    icon: Brain,
    badge: 'Paso 3',
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    title: 'Estimación de IA (Gemini)',
    body: `Un modelo de lenguaje (Gemini de Google) recibe el tema trending, su categoría y el contexto disponible, y produce una estimación de probabilidad entre 10% y 90%. El modelo fue instruido para ser conservador: nunca asigna probabilidades extremas porque en predicción real siempre existe incertidumbre. La temperatura de generación es moderada (0.8) para balancear creatividad y realismo en la estimación.`,
  },
  {
    icon: Users,
    badge: 'Paso 4',
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    title: 'Sabiduría colectiva',
    body: `Una vez activo el poll, las predicciones de la comunidad mueven el porcentaje. El número que ves refleja el ratio de puntos apostados a SÍ sobre el total de puntos apostados: si el 80% de los puntos apostaron que el evento va a ocurrir, la probabilidad del mercado sube a 80%. Quien arriesga más puntos tiene más influencia en el porcentaje visible. Esto convierte al número en un termómetro de la convicción colectiva, ponderada por lo que cada participante está dispuesto a apostar.`,
  },
];

export default function MetodologiaPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <Link
          href="/markets"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a mercados
        </Link>

        <div className="mb-10">
          <h1 className="text-3xl font-bold mb-3">¿Cómo se forma el porcentaje de cada poll?</h1>
          <p className="text-muted-foreground text-base leading-relaxed">
            El número que ves en cada poll no es arbitrario. Es una estimación de probabilidad
            construida en cuatro pasos, que combina señales de datos públicos, contexto histórico,
            inteligencia artificial y la opinión de la comunidad.
          </p>
        </div>

        <div className="space-y-6 mb-12">
          {STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <Card key={step.badge}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${step.bg}`}>
                      <Icon className={`h-5 w-5 ${step.color}`} />
                    </div>
                    <div>
                      <Badge variant="outline" className="text-xs mb-1">
                        {step.badge}
                      </Badge>
                      <CardTitle className="text-lg">{step.title}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.body}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <CardTitle className="text-base">Lo que el modelo no contempla</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-muted-foreground space-y-2 leading-relaxed">
              <li>
                <strong>Información en tiempo real post-creación:</strong> el sistema no accede a
                noticias del día, declaraciones de último momento ni resultados en vivo después de
                que el poll es creado.
              </li>
              <li>
                <strong>Credenciales individuales:</strong> no se pondera quién participa ni su
                historial de aciertos. Todos los puntos cuentan igual en el cálculo.
              </li>
              <li>
                <strong>Certeza absoluta:</strong> un poll con 80% no garantiza que ese evento
                ocurra. Significa que —según el modelo y la comunidad— ese desenlace es más probable
                que su contrario. La incertidumbre es inherente a cualquier predicción.
              </li>
            </ul>
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground text-center mt-10">
          ¿Tenés preguntas o sugerencias sobre la metodología?{' '}
          <Link href="/about" className="underline hover:text-foreground transition-colors">
            Contactanos
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

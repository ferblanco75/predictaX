import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
  TrendingUp,
  Users,
  Target,
  MapPin,
  Brain,
  Grid3x3,
  Zap,
  BarChart3,
  Smartphone,
  TrendingDown,
  Calendar,
} from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Acerca de',
  description:
    'Conoce más sobre PredictaX, la plataforma de mercados de predicción de América Latina. Descubre cómo funcionan los prediction markets y por qué somos diferentes.',
  openGraph: {
    title: 'Acerca de PredictaX',
    description:
      'Mercados de predicción con IA para América Latina. Toma decisiones informadas con la sabiduría colectiva.',
    type: 'website',
  },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 text-white py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Predecimos el futuro de América Latina
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto">
            Combinamos la sabiduría colectiva con inteligencia artificial para crear los mercados de
            predicción más precisos de la región
          </p>
        </div>
      </section>

      {/* What are Prediction Markets Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              ¿Qué son los mercados de predicción?
            </h2>

            <Card className="mb-8">
              <CardContent className="pt-6">
                <p className="text-lg text-muted-foreground mb-6">
                  Los mercados de predicción son plataformas donde las personas pueden pronosticar
                  el resultado de eventos futuros. A diferencia de las encuestas tradicionales, los
                  participantes tienen incentivos reales para ser precisos, lo que genera
                  probabilidades más confiables.
                </p>
                <p className="text-lg text-muted-foreground">
                  Al agregar las predicciones de miles de personas, obtenemos un &ldquo;consenso
                  inteligente&rdquo; que históricamente ha demostrado ser más preciso que los
                  expertos individuales o los sondeos tradicionales.
                </p>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center mb-4">
                    <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <CardTitle>Sabiduría Colectiva</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Miles de participantes aportan su conocimiento y experiencia para generar
                    predicciones más precisas
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mb-4">
                    <Target className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <CardTitle>Probabilidades Precisas</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Los mercados agregán información de forma eficiente, generando probabilidades
                    más confiables que otros métodos
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center mb-4">
                    <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <CardTitle>Decisiones Informadas</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Usa estas probabilidades para tomar mejores decisiones en tu negocio,
                    inversiones o vida personal
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Why NeuroPredict Section */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            ¿Por qué NeuroPredict?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <Card>
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center mb-4">
                  <MapPin className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle>Enfocado en LATAM</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Somos la primera plataforma de mercados de predicción diseñada específicamente
                  para América Latina, con eventos y categorías relevantes para la región
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center mb-4">
                  <Brain className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <CardTitle>Insights con IA</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Nuestros modelos de inteligencia artificial analizan miles de datos en tiempo real
                  para proporcionar predicciones mejoradas y análisis profundos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mb-4">
                  <Grid3x3 className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle>Múltiples Categorías</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Desde economía y política hasta deportes, tecnología y crypto. Predicciones sobre
                  los temas que más te importan
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <CardTitle>Comunidad Activa</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Únete a una comunidad de analistas, inversores y entusiastas que comparten sus
                  perspectivas y aprenden juntos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <CardTitle>Tiempo Real</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Las probabilidades se actualizan en tiempo real a medida que llegan nuevas
                  predicciones y información al mercado
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/20 flex items-center justify-center mb-4">
                  <BarChart3 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <CardTitle>Análisis Profundo</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Visualiza tendencias históricas, compara probabilidades y accede a métricas
                  avanzadas para cada mercado
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Roadmap Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Nuestro Roadmap</h2>

          <div className="max-w-4xl mx-auto space-y-6">
            <Card className="border-l-4 border-l-green-500">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-muted-foreground" />
                    <CardTitle>Q1 2026 - Lanzamiento de Plataforma</CardTitle>
                  </div>
                  <Badge className="bg-green-500 hover:bg-green-600">Completado</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Demo frontend con mercados de ejemplo</li>
                  <li>Categorías: Economía, Política, Deportes, Tecnología, Crypto</li>
                  <li>Gráficos de probabilidades interactivos</li>
                  <li>Sistema de predicciones básico</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-yellow-500">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-muted-foreground" />
                    <CardTitle>Q2 2026 - Modelos de IA</CardTitle>
                  </div>
                  <Badge variant="outline" className="border-yellow-500 text-yellow-600">
                    En progreso
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Backend completo con API REST</li>
                  <li>Modelos de machine learning para predicciones mejoradas</li>
                  <li>Sistema de reputación de usuarios</li>
                  <li>Análisis automático de noticias y eventos</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-gray-300 dark:border-l-gray-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-muted-foreground" />
                    <CardTitle>Q3 2026 - Aplicación Móvil</CardTitle>
                  </div>
                  <Badge variant="secondary">Próximamente</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>App nativa para iOS y Android</li>
                  <li>Notificaciones push para eventos importantes</li>
                  <li>Widget de mercados favoritos</li>
                  <li>Modo offline y sincronización</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-gray-300 dark:border-l-gray-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-muted-foreground" />
                    <CardTitle>Q4 2026 - Analytics Avanzado</CardTitle>
                  </div>
                  <Badge variant="secondary">Próximamente</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Dashboard personalizado con métricas</li>
                  <li>Comparación de predicciones vs resultados reales</li>
                  <li>Reportes exportables y API pública</li>
                  <li>Integración con herramientas de business intelligence</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Únete a la revolución de los mercados de predicción
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Sé parte de nuestra comunidad y accede primero a nuevas funciones
          </p>
          <Link href="/waitlist">
            <Button size="lg" variant="secondary" className="text-lg px-8">
              Únete a la lista de espera
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

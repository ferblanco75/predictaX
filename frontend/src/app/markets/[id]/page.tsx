'use client';

import { use, useState, useEffect } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  DollarSign,
  Clock,
  ArrowLeft,
  AlertCircle,
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getMarketById, getRelatedMarkets } from '@/lib/data';
import { getCategoryColor } from '@/lib/data/categories';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { MarketCard } from '@/components/markets/MarketCard';
import { MarketDetailSkeleton } from '@/components/markets/MarketDetailSkeleton';
import { EmptyPredictions } from '@/components/ui/EmptyState';
import { ProbabilityChart } from '@/components/markets/ProbabilityChart';
import { TimeframeSelector, type Timeframe } from '@/components/markets/TimeframeSelector';
import { PredictionForm } from '@/components/markets/PredictionForm';
import { useAppStore } from '@/lib/stores/app-store';
import { cn } from '@/lib/utils';

export default function MarketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const market = getMarketById(resolvedParams.id);
  const { isLoggedIn } = useAppStore();

  const [timeframe, setTimeframe] = useState<Timeframe>('ALL');
  const [isLoading, setIsLoading] = useState(false);

  const handlePredictionSubmit = (prediction: number, betAmount: number) => {
    // Handle prediction submission
    alert(`Predicción confirmada: ${prediction}% con ${betAmount} puntos`);
  };

  // Simulate loading (disabled for build)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsLoading(true);
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [resolvedParams.id]);

  if (!market) {
    notFound();
  }

  if (isLoading) {
    return <MarketDetailSkeleton />;
  }

  const relatedMarkets = getRelatedMarkets(market.id);
  const categoryColor = getCategoryColor(market.category);

  // Calculate trend
  const trend =
    market.history.length >= 2
      ? market.probability - market.history[market.history.length - 2].probability
      : 0;
  const isPositiveTrend = trend > 0;

  // Format dates
  const endDate = format(new Date(market.endDate), 'dd MMM yyyy', { locale: es });

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Back button */}
        <Link
          href="/markets"
          className={cn(buttonVariants({ variant: 'ghost' }), 'mb-4 flex items-center space-x-2')}
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Volver a mercados</span>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between mb-4">
                  <Badge
                    variant="secondary"
                    className="capitalize"
                    style={{ backgroundColor: `${categoryColor}20`, color: categoryColor }}
                  >
                    {market.category}
                  </Badge>
                  {market.status === 'resolved' && (
                    <Badge variant="outline">Resuelto</Badge>
                  )}
                </div>
                <CardTitle className="text-3xl">{market.title}</CardTitle>
                <div className="flex items-center space-x-4 text-sm text-gray-600 mt-4">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>Cierra: {endDate}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="h-4 w-4" />
                    <span>{market.participants} participantes</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <DollarSign className="h-4 w-4" />
                    <span>{market.volume} volumen</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  {market.description.split('\n\n').map((paragraph, index) => (
                    <p key={index} className="text-gray-700 mb-4">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Probability and Chart */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-5xl font-bold text-gray-900">{market.probability}%</div>
                    <div className="text-sm text-gray-500 mt-1">Probabilidad actual</div>
                  </div>
                  {trend !== 0 && (
                    <div
                      className={`flex items-center space-x-2 px-4 py-2 rounded-full ${
                        isPositiveTrend ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {isPositiveTrend ? (
                        <TrendingUp className="h-5 w-5" />
                      ) : (
                        <TrendingDown className="h-5 w-5" />
                      )}
                      <span className="font-medium">
                        {isPositiveTrend ? '+' : ''}
                        {trend.toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
                <TimeframeSelector value={timeframe} onChange={setTimeframe} />
              </CardHeader>
              <CardContent>
                <ProbabilityChart data={market.history} categoryColor={categoryColor} />
              </CardContent>
            </Card>

            {/* Prediction Form */}
            {market.status === 'active' && (
              <PredictionForm
                marketId={market.id}
                currentProbability={market.probability}
                onSubmit={handlePredictionSubmit}
                disabled={!isLoggedIn}
              />
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Market Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Estadísticas del mercado</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Volumen total</span>
                  <span className="font-semibold">{market.volume}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Participantes</span>
                  <span className="font-semibold">{market.participants}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Fecha de cierre</span>
                  <span className="font-semibold">{endDate}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Estado</span>
                  <Badge variant={market.status === 'active' ? 'default' : 'secondary'}>
                    {market.status === 'active' ? 'Activo' : 'Resuelto'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Recent Predictions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Predicciones recientes</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Empty state - In a real app, this would check if there are predictions */}
                <EmptyPredictions />
              </CardContent>
            </Card>

            {/* Related Markets */}
            {relatedMarkets.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Mercados relacionados</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {relatedMarkets.map((relatedMarket) => (
                    <Link
                      key={relatedMarket.id}
                      href={`/markets/${relatedMarket.id}`}
                      className="block group"
                    >
                      <div className="border rounded-lg p-3 hover:border-blue-500 transition-colors">
                        <h4 className="font-medium text-sm line-clamp-2 group-hover:text-blue-600 mb-2">
                          {relatedMarket.title}
                        </h4>
                        <div className="flex items-center justify-between">
                          <span className="text-2xl font-bold">{relatedMarket.probability}%</span>
                          <Badge
                            variant="secondary"
                            className="capitalize text-xs"
                            style={{
                              backgroundColor: `${getCategoryColor(relatedMarket.category)}20`,
                              color: getCategoryColor(relatedMarket.category),
                            }}
                          >
                            {relatedMarket.category}
                          </Badge>
                        </div>
                      </div>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { Users, Calendar, DollarSign, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getCategoryColor } from '@/lib/data/categories';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { MarketDetailClient } from './MarketDetailClient';
import { EmptyPredictions } from '@/components/ui/EmptyState';
import { generateMarketStructuredData } from '@/lib/utils/structured-data';
import { useMarket } from '@/lib/hooks/useMarkets';
import { getRelatedMarkets } from '@/lib/api/markets';
import type { Market } from '@/lib/types';

interface MarketDetailPageProps {
  id: string;
  initialMarket?: Market;
}

function formatEndDate(endDate: string): string {
  const d = new Date(endDate);
  return format(new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()), 'dd MMM yyyy', {
    locale: es,
  });
}

export function MarketDetailPage({ id, initialMarket }: MarketDetailPageProps) {
  const { data: fetchedMarket, isLoading, isError } = useMarket(id, { enabled: !initialMarket });
  const market = initialMarket ?? fetchedMarket;

  if (!initialMarket && isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 space-y-6">
          <div className="h-6 w-40 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
              <div className="h-48 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
            </div>
            <div className="space-y-6">
              <div className="h-48 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!market || isError) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Link
            href="/markets"
            className="mb-4 inline-flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Volver a mercados</span>
          </Link>
          <p className="text-gray-500 mt-8">Mercado no encontrado.</p>
        </div>
      </div>
    );
  }

  const relatedMarkets = getRelatedMarkets(market.id);
  const categoryColor = getCategoryColor(market.category);
  const endDate = formatEndDate(market.endDate);
  const structuredData = generateMarketStructuredData(market);
  const isLoggedIn = false;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        suppressHydrationWarning
      />

      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Link
            href="/markets"
            className="mb-4 inline-flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Volver a mercados</span>
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
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
                    {market.status === 'resolved' && <Badge variant="outline">Resuelto</Badge>}
                  </div>
                  <CardTitle className="text-3xl">{market.title}</CardTitle>
                  <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mt-4">
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
                  <div className="prose max-w-none dark:prose-invert">
                    {market.description.split('\n\n').map((paragraph, index) => (
                      <p key={index} className="text-gray-700 dark:text-gray-300 mb-4">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <MarketDetailClient
                market={market}
                categoryColor={categoryColor}
                isLoggedIn={isLoggedIn}
              />
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Estadísticas del mercado</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Volumen total</span>
                    <span className="font-semibold">{market.volume}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Participantes</span>
                    <span className="font-semibold">{market.participants}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Fecha de cierre</span>
                    <span className="font-semibold">{endDate}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Estado</span>
                    <Badge variant={market.status === 'active' ? 'default' : 'secondary'}>
                      {market.status === 'active' ? 'Activo' : 'Resuelto'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Predicciones recientes</CardTitle>
                </CardHeader>
                <CardContent>
                  <EmptyPredictions />
                </CardContent>
              </Card>

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
                        <div className="border rounded-lg p-3 hover:border-blue-500 transition-colors dark:border-gray-700">
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
    </>
  );
}

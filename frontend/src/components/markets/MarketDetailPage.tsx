'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Users, Calendar, Coins, ArrowLeft, Clock3, Share2, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getCategoryColor } from '@/lib/data/categories';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { MarketDetailClient } from './MarketDetailClient';
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
  const [copied, setCopied] = useState(false);
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
  const statusConfig = {
    active: {
      label: 'Activo',
      className: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
    },
    resolved: {
      label: 'Resuelto',
      className: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400',
    },
    cancelled: {
      label: 'Cancelado',
      className: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
    },
  }[market.status] ?? {
    label: market.status,
    className: 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300',
  };

  const handleCopyLink = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

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
                    <Badge variant="secondary" className={statusConfig.className}>
                      {statusConfig.label}
                    </Badge>
                  </div>
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <CardTitle className="text-3xl">{market.title}</CardTitle>
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-900"
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
                      {copied ? 'Link copiado' : 'Compartir'}
                    </button>
                  </div>
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
                      <Coins className="h-4 w-4" />
                      <span>Volumen: {market.volume}</span>
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
                    <span className="text-sm text-gray-600 dark:text-gray-400">Volumen virtual</span>
                    <span className="font-semibold">{market.volume}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Participantes</span>
                    <span className="font-semibold">{market.participants}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Fecha de cierre
                    </span>
                    <span className="font-semibold">{endDate}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Estado</span>
                    <Badge variant="secondary" className={statusConfig.className}>
                      {statusConfig.label}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Predicciones recientes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-xl border border-dashed border-gray-300 p-4 text-center dark:border-gray-700">
                    <Clock3 className="mx-auto mb-3 h-8 w-8 text-gray-400" />
                    <p className="font-medium">Feed público en preparación</p>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      En esta versión MVP todavía no mostramos predicciones recientes individuales.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-900">
                      <p className="text-gray-500 dark:text-gray-400">Participantes</p>
                      <p className="mt-1 font-semibold">{market.participants}</p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-900">
                      <p className="text-gray-500 dark:text-gray-400">Volumen</p>
                      <p className="mt-1 font-semibold">{market.volume}</p>
                    </div>
                  </div>
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

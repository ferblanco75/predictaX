'use client';

import Link from 'next/link';
import { TrendingUp, TrendingDown, Users, Calendar, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Market } from '@/lib/types';
import { getCategoryColor } from '@/lib/data/categories';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Progress } from '@/components/ui/progress';
import { ProbabilityGauge } from './ProbabilityGauge';
import { motion } from 'framer-motion';

interface MarketCardProps {
  market: Market;
}

export function MarketCard({ market }: MarketCardProps) {
  // Calculate trend from history
  const trend =
    market.history.length >= 2
      ? market.probability - market.history[market.history.length - 2].probability
      : 0;

  const isPositiveTrend = trend > 0;
  const categoryColor = getCategoryColor(market.category);

  // Format end date
  const endDate = format(new Date(market.endDate), 'dd MMM yyyy', { locale: es });

  return (
    <motion.div whileHover={{ scale: 1.02, y: -2 }} transition={{ duration: 0.2, ease: 'easeOut' }}>
      <Link href={`/markets/${market.id}`} aria-label={`Ver detalles: ${market.title}`}>
        <Card className="h-full shadow-sm hover:shadow-xl transition-shadow cursor-pointer group">
          <CardHeader className="space-y-2">
            {/* Category badge */}
            <div className="flex items-center justify-between">
              <Badge
                variant="secondary"
                className="capitalize"
                style={{ backgroundColor: `${categoryColor}20`, color: categoryColor }}
              >
                {market.category}
              </Badge>
              {market.status === 'resolved' && (
                <Badge variant="outline" className="text-xs">
                  Resuelto
                </Badge>
              )}
            </div>

            {/* Title */}
            <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-blue-600 transition-colors">
              {market.title}
            </h3>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Render based on market type */}
            {(!market.type || market.type === 'binary') && (
              <>
                {/* Binary: Probability - Gauge visual */}
                <div className="flex flex-col items-center space-y-3">
                  <ProbabilityGauge
                    probability={market.probability}
                    size="small"
                    showLabel={false}
                  />

                  {/* Trend indicator below gauge */}
                  {trend !== 0 && (
                    <div
                      className={`flex items-center space-x-1 px-3 py-1 rounded-full ${
                        isPositiveTrend
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}
                    >
                      {isPositiveTrend ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                      <span className="text-sm font-medium">
                        {isPositiveTrend ? '+' : ''}
                        {trend.toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
              </>
            )}

            {market.type === 'multiple_choice' && market.options && (
              <>
                {/* Multiple Choice: Top options with bars */}
                <div className="space-y-3">
                  {market.options
                    .sort((a, b) => b.probability - a.probability)
                    .slice(0, 3)
                    .map((option) => (
                      <div key={option.id} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium truncate flex-1 mr-2">{option.label}</span>
                          <span className="font-bold text-blue-600 dark:text-blue-400">
                            {option.probability}%
                          </span>
                        </div>
                        <Progress value={option.probability} className="h-2" />
                      </div>
                    ))}
                  {market.options.length > 3 && (
                    <p className="text-xs text-gray-500 text-center mt-2">
                      +{market.options.length - 3} opciones más
                    </p>
                  )}
                </div>
              </>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 pt-2 border-t">
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <Users className="h-4 w-4" />
                <span>{market.participants} predicciones</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <TrendingUp className="h-4 w-4" />
                <span>{market.volume} volumen</span>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex items-center justify-between border-t pt-4">
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Calendar className="h-4 w-4" />
              <span>Cierra: {endDate}</span>
            </div>
            <div className="flex items-center space-x-1 text-sm text-blue-600 font-medium group-hover:text-blue-700">
              <span>Ver detalles</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </CardFooter>
        </Card>
      </Link>
    </motion.div>
  );
}

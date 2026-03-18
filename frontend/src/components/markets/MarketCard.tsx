import Link from 'next/link';
import { TrendingUp, TrendingDown, Users, Calendar, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Market } from '@/lib/types';
import { getCategoryColor } from '@/lib/data/categories';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

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
    <Link href={`/markets/${market.id}`}>
      <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer group">
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
          {/* Probability - Large and prominent */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-4xl font-bold text-gray-900">{market.probability}%</div>
              <div className="text-sm text-gray-500 mt-1">Probabilidad</div>
            </div>

            {/* Trend indicator */}
            {trend !== 0 && (
              <div
                className={`flex items-center space-x-1 px-3 py-1 rounded-full ${
                  isPositiveTrend ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
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

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Users className="h-4 w-4" />
              <span>{market.participants} predicciones</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
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
  );
}

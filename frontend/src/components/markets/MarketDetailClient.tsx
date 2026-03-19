'use client';

import { useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ProbabilityChart } from './ProbabilityChart';
import { TimeframeSelector, type Timeframe } from './TimeframeSelector';
import { PredictionForm } from './PredictionForm';
import type { Market } from '@/lib/types';

interface MarketDetailClientProps {
  market: Market;
  categoryColor: string;
  isLoggedIn: boolean;
}

export function MarketDetailClient({ market, categoryColor, isLoggedIn }: MarketDetailClientProps) {
  const [timeframe, setTimeframe] = useState<Timeframe>('ALL');

  const handlePredictionSubmit = (prediction: number, betAmount: number) => {
    alert(`Predicción confirmada: ${prediction}% con ${betAmount} puntos`);
  };

  // Calculate trend
  const trend =
    market.history.length >= 2
      ? market.probability - market.history[market.history.length - 2].probability
      : 0;
  const isPositiveTrend = trend > 0;

  return (
    <>
      {/* Probability and Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-5xl font-bold text-gray-900 dark:text-gray-100">
                {market.probability}%
              </div>
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
    </>
  );
}

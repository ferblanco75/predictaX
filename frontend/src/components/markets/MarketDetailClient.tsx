'use client';

import { useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProbabilityChart } from './ProbabilityChart';
import { TimeframeSelector, type Timeframe } from './TimeframeSelector';
import { PredictionForm } from './PredictionForm';
import { MultipleChoiceBarChart } from './MultipleChoiceBarChart';
import { MultipleChoicePredictionForm } from './MultipleChoicePredictionForm';
import { ProbabilityGauge } from './ProbabilityGauge';
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

  const handleMultipleChoicePredictionSubmit = (
    predictions: Record<string, number>,
    betAmount: number
  ) => {
    alert(
      `Predicción confirmada con ${betAmount} puntos:\n${Object.entries(predictions)
        .map(([id, prob]) => {
          const option = market.options?.find((o) => o.id === id);
          return `${option?.label}: ${prob}%`;
        })
        .join('\n')}`
    );
  };

  // Calculate trend
  const trend =
    market.history.length >= 2
      ? market.probability - market.history[market.history.length - 2].probability
      : 0;
  const isPositiveTrend = trend > 0;

  const marketType = market.type || 'binary';

  return (
    <>
      {/* Binary Market */}
      {marketType === 'binary' && (
        <>
          {/* Probability and Chart */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-6">
                  <ProbabilityGauge probability={market.probability} size="large" showLabel={false} />
                  <div>
                    <div className="text-5xl font-bold text-gray-900 dark:text-gray-100">
                      {market.probability}%
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Probabilidad actual
                    </div>
                  </div>
                </div>
                {trend !== 0 && (
                  <div
                    className={`flex items-center space-x-2 px-4 py-2 rounded-full ${
                      isPositiveTrend
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
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
      )}

      {/* Multiple Choice Market */}
      {marketType === 'multiple_choice' && market.options && (
        <>
          {/* Options Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Distribución de probabilidades</CardTitle>
            </CardHeader>
            <CardContent>
              <MultipleChoiceBarChart options={market.options} categoryColor={categoryColor} />
            </CardContent>
          </Card>

          {/* Prediction Form */}
          {market.status === 'active' && (
            <MultipleChoicePredictionForm
              marketId={market.id}
              options={market.options}
              onSubmit={handleMultipleChoicePredictionSubmit}
              disabled={!isLoggedIn}
            />
          )}
        </>
      )}
    </>
  );
}

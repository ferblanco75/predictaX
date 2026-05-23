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
import { useMakePrediction } from '@/lib/hooks/useMakePrediction';
import { MarketStats } from './MarketStats';
import type { Market } from '@/lib/types';

interface MarketDetailClientProps {
  market: Market;
  categoryColor: string;
  isLoggedIn: boolean;
}

const timeframeDurationsMs: Partial<Record<Timeframe, number>> = {
  '1H': 60 * 60 * 1000,
  '6H': 6 * 60 * 60 * 1000,
  '1D': 24 * 60 * 60 * 1000,
  '1W': 7 * 24 * 60 * 60 * 1000,
  '1M': 30 * 24 * 60 * 60 * 1000,
};

function filterHistoryByTimeframe(history: Market['history'], timeframe: Timeframe) {
  if (timeframe === 'ALL' || history.length === 0) return history;

  const latestTimestamp = Math.max(...history.map((point) => new Date(point.date).getTime()));
  const duration = timeframeDurationsMs[timeframe];
  if (!duration || Number.isNaN(latestTimestamp)) return history;

  const cutoff = latestTimestamp - duration;
  const filtered = history.filter((point) => new Date(point.date).getTime() >= cutoff);

  return filtered.length > 0 ? filtered : history;
}

export function MarketDetailClient({ market, categoryColor, isLoggedIn }: MarketDetailClientProps) {
  const [timeframe, setTimeframe] = useState<Timeframe>('ALL');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );
  const prediction = useMakePrediction(market.id);

  const handlePredictionSubmit = (predictionValue: number, amount: number) => {
    setFeedback(null);
    prediction.mutate(
      { predictionValue, amount },
      {
        onSuccess: () =>
          setFeedback({
            type: 'success',
            message: `Predicción registrada: ${predictionValue}% con ${amount} puntos`,
          }),
        onError: (err) => setFeedback({ type: 'error', message: err.message }),
      }
    );
  };

  const handleMultipleChoicePredictionSubmit = (
    predictions: Record<string, number>,
    amount: number
  ) => {
    const topOption = Object.entries(predictions).sort(([, a], [, b]) => b - a)[0];
    if (!topOption) return;
    setFeedback(null);
    prediction.mutate(
      { predictionValue: topOption[1], amount },
      {
        onSuccess: () =>
          setFeedback({ type: 'success', message: `Predicción registrada con ${amount} puntos` }),
        onError: (err) => setFeedback({ type: 'error', message: err.message }),
      }
    );
  };

  // Calculate trend
  const trend =
    market.history.length >= 2
      ? market.probability - market.history[market.history.length - 2].probability
      : 0;
  const isPositiveTrend = trend > 0;

  const marketType = market.type || 'binary';
  const chartHistory = filterHistoryByTimeframe(market.history, timeframe);

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
                  <ProbabilityGauge
                    probability={market.probability}
                    size="large"
                    showLabel={false}
                  />
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
              <ProbabilityChart data={chartHistory} categoryColor={categoryColor} />
            </CardContent>
          </Card>

          {/* Stats block — only for markets with statsData */}
          {market.statsData && (
            <MarketStats statsData={market.statsData as Record<string, unknown>} />
          )}

          {/* Prediction Form */}
          {market.status === 'active' && (
            <>
              <PredictionForm
                currentProbability={market.probability}
                endDate={market.endDate}
                onSubmit={handlePredictionSubmit}
                disabled={!isLoggedIn || prediction.isPending}
                requiresAuth={!isLoggedIn}
              />
              {feedback && (
                <div
                  className={`mt-2 px-4 py-3 rounded-lg text-sm font-medium ${
                    feedback.type === 'success'
                      ? 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400'
                      : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400'
                  }`}
                >
                  {feedback.message}
                </div>
              )}
            </>
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
            <>
              <MultipleChoicePredictionForm
                options={market.options}
                endDate={market.endDate}
                onSubmit={handleMultipleChoicePredictionSubmit}
                disabled={!isLoggedIn || prediction.isPending}
                requiresAuth={!isLoggedIn}
              />
              {feedback && (
                <div
                  className={`mt-2 px-4 py-3 rounded-lg text-sm font-medium ${
                    feedback.type === 'success'
                      ? 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400'
                      : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400'
                  }`}
                >
                  {feedback.message}
                </div>
              )}
            </>
          )}
        </>
      )}
    </>
  );
}

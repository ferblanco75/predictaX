'use client';

import { useState } from 'react';
import { TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProbabilityChart } from './ProbabilityChart';
import { TimeframeSelector, type Timeframe } from './TimeframeSelector';
import { PredictionForm } from './PredictionForm';
import { MultipleChoiceBarChart } from './MultipleChoiceBarChart';
import { MultipleChoicePredictionForm } from './MultipleChoicePredictionForm';
import { ProbabilityGauge } from './ProbabilityGauge';
import { useMakePrediction, useUserMarketPrediction } from '@/lib/hooks/useMakePrediction';
import { MarketStats } from './MarketStats';
import { MatchLiveStats } from '@/components/football/MatchLiveStats';
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
  const { data: existingPrediction } = useUserMarketPrediction(market.id);

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
  const isExpired = market.status === 'active' && new Date(market.endDate) < new Date();

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

          {/* Live match stats — only for markets linked to a fixture */}
          {market.fixtureId && <MatchLiveStats fixtureId={market.fixtureId} />}

          {/* Stats block — only for markets with statsData */}
          {market.statsData && (
            <MarketStats statsData={market.statsData as Record<string, unknown>} />
          )}

          {/* Expired banner */}
          {isExpired && (
            <div className="flex items-center gap-3 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
              <Clock className="h-5 w-5 shrink-0 text-amber-500" />
              <div>
                <p className="font-semibold">Este mercado cerró — pendiente de resolución</p>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">Ya no se aceptan nuevas predicciones.</p>
              </div>
            </div>
          )}

          {/* Prediction Form */}
          {market.status === 'active' && !isExpired && (
            <>
              <PredictionForm
                currentProbability={market.probability}
                endDate={market.endDate}
                onSubmit={handlePredictionSubmit}
                disabled={!isLoggedIn || prediction.isPending}
                requiresAuth={!isLoggedIn}
                existingPrediction={existingPrediction}
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
          {market.status === 'active' && !isExpired && (
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

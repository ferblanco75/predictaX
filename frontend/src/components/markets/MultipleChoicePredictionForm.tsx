'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { getOptionColor } from './MultipleChoiceBarChart';
import type { MultipleChoiceOption } from '@/lib/types';

interface MultipleChoicePredictionFormProps {
  marketId: string;
  options: MultipleChoiceOption[];
  onSubmit: (predictions: Record<string, number>, betAmount: number) => void;
  disabled?: boolean;
}

export function MultipleChoicePredictionForm({
  marketId,
  options,
  onSubmit,
  disabled = false,
}: MultipleChoicePredictionFormProps) {
  // Initialize predictions with current probabilities
  const [predictions, setPredictions] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    options.forEach((option) => {
      initial[option.id] = option.probability;
    });
    return initial;
  });

  const [betAmount, setBetAmount] = useState(100);
  const [error, setError] = useState<string>();

  // Calculate total probability
  const totalProbability = Object.values(predictions).reduce((sum, val) => sum + val, 0);

  // Normalize probabilities to sum to 100%
  const normalizeProbabilities = () => {
    const total = totalProbability;
    if (total === 0) return;

    const normalized: Record<string, number> = {};
    Object.entries(predictions).forEach(([id, value]) => {
      normalized[id] = Math.round((value / total) * 100);
    });

    // Adjust for rounding errors
    const newTotal = Object.values(normalized).reduce((sum, val) => sum + val, 0);
    if (newTotal !== 100) {
      const diff = 100 - newTotal;
      const firstKey = Object.keys(normalized)[0];
      normalized[firstKey] += diff;
    }

    setPredictions(normalized);
  };

  const handleSliderChange = (optionId: string, value: number) => {
    setPredictions((prev) => ({
      ...prev,
      [optionId]: value,
    }));
    setError(undefined);
  };

  const handleSubmit = () => {
    if (betAmount < 1) {
      setError('Debes apostar al menos 1 punto');
      return;
    }
    if (betAmount > 10000) {
      setError('El máximo de puntos es 10,000');
      return;
    }

    const total = totalProbability;
    if (Math.abs(total - 100) > 0.5) {
      setError(`La suma de probabilidades debe ser 100% (actualmente: ${total.toFixed(1)}%)`);
      return;
    }

    setError(undefined);
    onSubmit(predictions, betAmount);
  };

  // Calculate potential gain (simplified)
  const potentialGain = betAmount * 0.5; // Simplified calculation

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hacer predicción</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Probability sliders for each option */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">Distribuye las probabilidades</label>
            <div className="flex items-center space-x-2">
              <span
                className={`text-lg font-bold ${
                  Math.abs(totalProbability - 100) < 0.5 ? 'text-green-600' : 'text-orange-600'
                }`}
              >
                {totalProbability.toFixed(1)}%
              </span>
              {Math.abs(totalProbability - 100) > 0.5 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={normalizeProbabilities}
                  disabled={disabled}
                >
                  Normalizar
                </Button>
              )}
            </div>
          </div>

          {options.map((option, index) => {
            const color = getOptionColor(index);
            return (
              <div key={option.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1 mr-4">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <label className="text-sm font-medium truncate">{option.label}</label>
                  </div>
                  <span className="text-lg font-bold w-16 text-right" style={{ color }}>
                    {predictions[option.id]}%
                  </span>
                </div>
                <Slider
                  value={[predictions[option.id]]}
                  onValueChange={(value) => {
                    const newValue = Array.isArray(value) ? value[0] : value;
                    handleSliderChange(option.id, newValue);
                  }}
                  max={100}
                  step={1}
                  disabled={disabled}
                />
              </div>
            );
          })}
        </div>

        {/* Bet amount */}
        <div>
          <label className="text-sm font-medium mb-2 block">Puntos a apostar</label>
          <Input
            type="number"
            value={betAmount}
            onChange={(e) => {
              setBetAmount(Number(e.target.value));
              setError(undefined);
            }}
            min={1}
            max={10000}
            disabled={disabled}
          />
        </div>

        {/* Error message */}
        {error && (
          <div className="flex items-center space-x-2 text-sm text-red-600 bg-red-50 dark:bg-red-950/20 p-3 rounded-lg">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Potential gain */}
        <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Ganancia potencial</span>
            <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
              +{potentialGain.toFixed(0)} puntos
            </span>
          </div>
        </div>

        {/* CTA Button */}
        <Button
          size="lg"
          className="w-full"
          onClick={handleSubmit}
          disabled={disabled || Math.abs(totalProbability - 100) > 0.5}
        >
          {disabled ? 'Inicia sesión para predecir' : 'Confirmar predicción'}
        </Button>

        <p className="text-xs text-gray-500 text-center">
          * Las probabilidades deben sumar 100%. Las predicciones no se pueden modificar después de
          confirmar.
        </p>
      </CardContent>
    </Card>
  );
}

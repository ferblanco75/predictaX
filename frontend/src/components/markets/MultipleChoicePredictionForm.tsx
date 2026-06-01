'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AlertCircle, Coins } from 'lucide-react';
import { useAppStore } from '@/lib/stores/app-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { getOptionColor } from './MultipleChoiceBarChart';
import type { MultipleChoiceOption } from '@/lib/types';

interface MultipleChoicePredictionFormProps {
  options: MultipleChoiceOption[];
  endDate: string;
  onSubmit: (predictions: Record<string, number>, betAmount: number) => void;
  disabled?: boolean;
  requiresAuth?: boolean;
}

function formatCloseDate(endDate: string) {
  const date = new Date(endDate);
  if (Number.isNaN(date.getTime())) return 'Fecha por confirmar';

  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/Argentina/Buenos_Aires',
  }).format(date);
}

function formatPoints(points: number) {
  return points.toLocaleString('es-AR', { maximumFractionDigits: 0 });
}

export function MultipleChoicePredictionForm({
  options,
  endDate,
  onSubmit,
  disabled = false,
  requiresAuth = false,
}: MultipleChoicePredictionFormProps) {
  // Initialize predictions with current probabilities
  const [predictions, setPredictions] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    options.forEach((option) => {
      initial[option.id] = option.probability;
    });
    return initial;
  });

  const { user } = useAppStore();
  const [betAmount, setBetAmount] = useState(100);
  const [error, setError] = useState<string>();

  const availablePoints = user?.points ?? 0;
  const maxBet = Math.min(10000, Math.floor(availablePoints));

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
      setError('Debes usar al menos 1 punto');
      return;
    }
    if (betAmount > availablePoints) {
      setError(`No tenés suficientes puntos (disponible: ${formatPoints(availablePoints)} pts)`);
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

  const predictionValues = Object.values(predictions);
  const selectedProbability = predictionValues.length > 0 ? Math.max(...predictionValues) : 0;
  const selectedOption = options.find((option) => predictions[option.id] === selectedProbability);
  const safeBetAmount = Number.isFinite(betAmount) ? Math.max(0, betAmount) : 0;
  // Payout formula: stake / (probability / 100), net gain = payout - stake
  const prob = selectedProbability > 0 ? selectedProbability : 50;
  const potentialGain = safeBetAmount / (prob / 100) - safeBetAmount;
  const maxLoss = safeBetAmount;
  const closeDate = formatCloseDate(endDate);

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

        {/* Points amount */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">Puntos a usar</label>
            {user && (
              <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                <Coins className="h-3.5 w-3.5" />
                <span>{formatPoints(availablePoints)} disponibles</span>
                <button
                  type="button"
                  className="ml-1 text-blue-600 hover:underline"
                  onClick={() => { setBetAmount(maxBet); setError(undefined); }}
                  disabled={disabled}
                >
                  Máx
                </button>
              </div>
            )}
          </div>
          <Input
            type="number"
            value={betAmount}
            onChange={(e) => {
              setBetAmount(Number(e.target.value));
              setError(undefined);
            }}
            min={1}
            max={maxBet}
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

        {/* Outcome summary */}
        <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-950/20">
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <span className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Si acertás
              </span>
              <div className="mt-1 text-xl font-bold text-emerald-600 dark:text-emerald-400">
                +{formatPoints(potentialGain)} pts
              </div>
            </div>
            <div>
              <span className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Si fallás
              </span>
              <div className="mt-1 text-xl font-bold text-red-600 dark:text-red-400">
                -{formatPoints(maxLoss)} pts
              </div>
            </div>
            <div>
              <span className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Cierre
              </span>
              <div className="mt-1 text-sm font-semibold text-blue-700 dark:text-blue-300">
                {closeDate}
              </div>
            </div>
          </div>
          <p className="mt-2 text-xs text-blue-700/70 dark:text-blue-300/70">
            Estimación MVP para tu opción principal
            {selectedOption ? ` (${selectedOption.label})` : ''}. La ganancia final puede cambiar
            según reglas y resolución del mercado.
          </p>
        </div>

        {requiresAuth && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
            <p className="font-medium">Iniciá sesión para participar</p>
            <p className="mt-1 text-amber-900/80 dark:text-amber-100/80">
              Necesitás una cuenta para registrar predicciones y usar tus puntos virtuales.
            </p>
            <Link
              href="/auth"
              className="mt-3 inline-flex rounded-lg bg-amber-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-700"
            >
              Iniciar sesión o registrarme
            </Link>
          </div>
        )}

        {/* CTA Button */}
        <Button
          size="lg"
          className="w-full active:scale-95 transition-transform"
          onClick={handleSubmit}
          disabled={disabled || Math.abs(totalProbability - 100) > 0.5}
        >
          {requiresAuth
            ? 'Iniciá sesión para predecir'
            : disabled
              ? 'Procesando...'
              : 'Confirmar predicción'}
        </Button>

        <p className="text-xs text-gray-500 text-center">
          * Las probabilidades deben sumar 100%. Las predicciones no se pueden modificar después de
          confirmar.
        </p>
      </CardContent>
    </Card>
  );
}

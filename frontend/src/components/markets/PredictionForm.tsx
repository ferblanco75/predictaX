'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AlertCircle, Coins, RefreshCw } from 'lucide-react';
import { useAppStore } from '@/lib/stores/app-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';

interface PredictionFormProps {
  currentProbability: number;
  endDate: string;
  onSubmit: (prediction: number, betAmount: number) => void;
  disabled?: boolean;
  requiresAuth?: boolean;
  existingPrediction?: { probability: number; points_wagered: number } | null;
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

export function PredictionForm({
  currentProbability,
  endDate,
  onSubmit,
  disabled = false,
  requiresAuth = false,
  existingPrediction = null,
}: PredictionFormProps) {
  const { user } = useAppStore();
  const [prediction, setPrediction] = useState(50);
  const [betAmount, setBetAmount] = useState(100);
  const [predictionError, setPredictionError] = useState<string>();
  const [confirmingOverride, setConfirmingOverride] = useState(false);

  const availablePoints = user?.points ?? 0;
  const maxBet = Math.min(10000, Math.floor(availablePoints));

  const handleSubmit = () => {
    if (betAmount < 1) {
      setPredictionError('Debes usar al menos 1 punto');
      return;
    }
    if (betAmount > Math.floor(availablePoints)) {
      setPredictionError(`No tenés suficientes puntos (disponible: ${formatPoints(Math.floor(availablePoints))} pts)`);
      return;
    }
    if (betAmount > 10000) {
      setPredictionError('El máximo de puntos es 10,000');
      return;
    }
    if (existingPrediction && !confirmingOverride) {
      setConfirmingOverride(true);
      return;
    }
    setPredictionError(undefined);
    setConfirmingOverride(false);
    onSubmit(prediction, betAmount);
  };

  const safeBetAmount = Number.isFinite(betAmount) ? Math.max(0, betAmount) : 0;
  // Payout formula: stake / (marketProbability / 100), net gain = payout - stake
  const prob = currentProbability > 0 ? currentProbability : 50;
  const potentialGain = safeBetAmount / (prob / 100) - safeBetAmount;
  const maxLoss = safeBetAmount;
  const closeDate = formatCloseDate(endDate);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hacer predicción</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Probability slider */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium">Tu predicción</label>
            <span className="text-2xl font-bold text-blue-600">{prediction}%</span>
          </div>
          <Slider
            value={[prediction]}
            onValueChange={(value) => {
              const newValue = Array.isArray(value) ? value[0] : value;
              setPrediction(newValue);
            }}
            max={100}
            step={1}
            className="mb-2"
            disabled={disabled}
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
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
                  onClick={() => { setBetAmount(maxBet); setPredictionError(undefined); }}
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
              setPredictionError(undefined);
            }}
            min={1}
            max={maxBet}
            aria-invalid={!!predictionError}
            disabled={disabled}
          />
          {predictionError && (
            <div className="flex items-center space-x-1 text-sm text-red-600 mt-2">
              <AlertCircle className="h-4 w-4" />
              <span>{predictionError}</span>
            </div>
          )}
        </div>

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
            Estimación MVP sobre probabilidad actual {currentProbability}%. La ganancia final puede
            cambiar según reglas y resolución del mercado.
          </p>
        </div>

        {requiresAuth ? (
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
        ) : (
          <>
            {existingPrediction && !confirmingOverride && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30 px-4 py-3 text-sm text-blue-800 dark:text-blue-200 flex items-start gap-2">
                <RefreshCw className="h-4 w-4 mt-0.5 shrink-0 text-blue-500" />
                <div>
                  <p className="font-medium">Ya tenés una predicción en este mercado</p>
                  <p className="text-xs mt-0.5 text-blue-700/80 dark:text-blue-300/80">
                    Tu apuesta anterior: {existingPrediction.probability}% con {formatPoints(existingPrediction.points_wagered)} pts. Confirmar agregará una nueva apuesta.
                  </p>
                </div>
              </div>
            )}

            {confirmingOverride && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
                <p className="font-medium">¿Confirmar nueva apuesta?</p>
                <p className="text-xs mt-0.5 text-amber-700/80 dark:text-amber-300/80">
                  Se descontarán {formatPoints(betAmount)} pts adicionales. Tus apuestas anteriores en este mercado siguen activas.
                </p>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white" onClick={handleSubmit} disabled={disabled}>
                    {disabled ? 'Procesando...' : 'Sí, apostar de nuevo'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setConfirmingOverride(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            )}

            {!confirmingOverride && (
              <Button size="lg" className="w-full active:scale-95 transition-transform" onClick={handleSubmit} disabled={disabled}>
                {disabled ? 'Procesando...' : 'Confirmar predicción'}
              </Button>
            )}

            <p className="text-xs text-gray-500 text-center">
              Las predicciones no se pueden modificar después de confirmar.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

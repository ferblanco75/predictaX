'use client';

import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';

interface PredictionFormProps {
  marketId: string;
  currentProbability: number;
  onSubmit: (prediction: number, betAmount: number) => void;
  disabled?: boolean;
}

export function PredictionForm({
  marketId,
  currentProbability,
  onSubmit,
  disabled = false,
}: PredictionFormProps) {
  const [prediction, setPrediction] = useState(50);
  const [betAmount, setBetAmount] = useState(100);
  const [predictionError, setPredictionError] = useState<string>();

  const handleSubmit = () => {
    if (betAmount < 1) {
      setPredictionError('Debes apostar al menos 1 punto');
      return;
    }
    if (betAmount > 10000) {
      setPredictionError('El máximo de puntos es 10,000');
      return;
    }
    setPredictionError(undefined);
    onSubmit(prediction, betAmount);
  };

  // Potential gain calculation (simplified)
  const potentialGain = ((100 - prediction) / 100) * betAmount;

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

        {/* Bet amount */}
        <div>
          <label className="text-sm font-medium mb-2 block">Puntos a apostar</label>
          <Input
            type="number"
            value={betAmount}
            onChange={(e) => {
              setBetAmount(Number(e.target.value));
              setPredictionError(undefined);
            }}
            min={1}
            max={10000}
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
        <Button size="lg" className="w-full" onClick={handleSubmit} disabled={disabled}>
          {disabled ? 'Inicia sesión para predecir' : 'Confirmar predicción'}
        </Button>

        <p className="text-xs text-gray-500 text-center">
          * Requiere iniciar sesión. Las predicciones no se pueden modificar después de confirmar.
        </p>
      </CardContent>
    </Card>
  );
}

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api/client';

interface PredictionPayload {
  market_id: string;
  prediction_value: number;
  amount: number;
}

interface PredictionResponse {
  id: string;
  market_id: string;
  prediction_value: number;
  amount: number;
}

export function useMakePrediction(marketId: string) {
  const queryClient = useQueryClient();

  return useMutation<PredictionResponse, Error, { predictionValue: number; amount: number }>({
    mutationFn: async ({ predictionValue, amount }) => {
      const res = await api.post<PredictionResponse>('/predictions', {
        market_id: marketId,
        prediction_value: predictionValue,
        amount,
      } satisfies PredictionPayload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['market', marketId] });
    },
  });
}

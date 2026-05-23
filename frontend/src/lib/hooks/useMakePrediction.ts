'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api/client';

interface PredictionPayload {
  market_id: string;
  probability: number;
  points_wagered: number;
}

interface PredictionResponse {
  id: string;
  user_id: string;
  market_id: string;
  probability: number;
  points_wagered: number;
  potential_gain: number | null;
  status: string;
}

export function useMakePrediction(marketId: string) {
  const queryClient = useQueryClient();

  return useMutation<PredictionResponse, Error, { predictionValue: number; amount: number }>({
    mutationFn: async ({ predictionValue, amount }) => {
      const res = await api.post<PredictionResponse>('/predictions', {
        market_id: marketId,
        probability: predictionValue,
        points_wagered: amount,
      } satisfies PredictionPayload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['market', marketId] });
    },
  });
}

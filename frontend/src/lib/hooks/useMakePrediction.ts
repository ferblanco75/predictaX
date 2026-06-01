'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api/client';
import { useAppStore } from '@/lib/stores/app-store';

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

interface UserResponse {
  id: string;
  username: string;
  email: string;
  points: number;
  role: string;
}

export function useMakePrediction(marketId: string) {
  const queryClient = useQueryClient();
  const { login, user } = useAppStore();

  return useMutation<PredictionResponse, Error, { predictionValue: number; amount: number }>({
    mutationFn: async ({ predictionValue, amount }) => {
      const res = await api.post<PredictionResponse>('/predictions', {
        market_id: marketId,
        probability: predictionValue,
        points_wagered: amount,
      } satisfies PredictionPayload);
      return res.data;
    },
    onSuccess: async (_, { amount }) => {
      queryClient.invalidateQueries({ queryKey: ['market', marketId] });

      // Sync real balance from backend; fall back to optimistic deduct if fetch fails
      try {
        const meRes = await api.get<UserResponse>('/auth/me');
        if (user) {
          login({ ...user, points: meRes.data.points });
        }
      } catch {
        useAppStore.getState().deductPoints(amount);
      }
    },
  });
}

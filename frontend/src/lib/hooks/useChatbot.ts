'use client';

import { useMutation } from '@tanstack/react-query';
import api from '@/lib/api/client';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatResponse {
  reply: string;
}

export function useSendChatMessage() {
  return useMutation({
    mutationFn: async ({ message, history }: { message: string; history: ChatMessage[] }) => {
      const res = await api.post<ChatResponse>('/chatbot', { message, history });
      return res.data;
    },
  });
}

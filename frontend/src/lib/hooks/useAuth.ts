'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import api from '@/lib/api/client';
import { useAppStore } from '@/lib/stores/app-store';

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
}

interface TokenResponse {
  access_token: string;
  token_type: string;
}

interface UserResponse {
  id: string;
  username: string;
  email: string;
  points: number;
  role: string;
  avatar_url?: string;
}

export function useLogin() {
  const { login } = useAppStore();
  const router = useRouter();

  return useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const tokenRes = await api.post<TokenResponse>('/auth/login', credentials);
      const { access_token } = tokenRes.data;
      localStorage.setItem('token', access_token);

      const meRes = await api.get<UserResponse>('/auth/me');
      return { token: access_token, user: meRes.data };
    },
    onSuccess: ({ token, user }) => {
      login({
        id: String(user.id),
        username: user.username,
        email: user.email,
        points: user.points,
        role: user.role || 'user',
        token,
      });
      if (user.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/markets');
      }
    },
  });
}

export function useRegister() {
  const { login } = useAppStore();
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: RegisterData) => {
      await api.post('/auth/register', data);
      // Auto-login after register
      const tokenRes = await api.post<TokenResponse>('/auth/login', {
        email: data.email,
        password: data.password,
      });
      const { access_token } = tokenRes.data;
      localStorage.setItem('token', access_token);

      const meRes = await api.get<UserResponse>('/auth/me');
      return { token: access_token, user: meRes.data };
    },
    onSuccess: ({ token, user }) => {
      login({
        id: String(user.id),
        username: user.username,
        email: user.email,
        points: user.points,
        role: user.role || 'user',
        token,
      });
      router.push('/markets');
    },
  });
}

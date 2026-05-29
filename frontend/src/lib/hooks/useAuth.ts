'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import api from '@/lib/api/client';
import { useAppStore } from '@/lib/stores/app-store';

interface LoginCredentials {
  email: string;
  password: string;
}

interface OTPRequestResponse {
  email: string;
  email_sent: boolean;
  expires_in_minutes: number;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  terms_accepted: boolean;
  privacy_accepted: boolean;
  is_adult: boolean;
  marketing_opt_in: boolean;
  legal_consent_version: string;
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

export function useRequestOTP() {
  return useMutation<OTPRequestResponse, Error, { email: string }>({
    mutationFn: async ({ email }) => {
      const res = await api.post<OTPRequestResponse>('/auth/otp/request', { email });
      return res.data;
    },
  });
}

export function useVerifyOTP() {
  const { login } = useAppStore();
  const router = useRouter();

  return useMutation<{ isNewUser: boolean }, Error, { email: string; code: string }>({
    mutationFn: async ({ email, code }) => {
      const tokenRes = await api.post<TokenResponse & { is_new_user: boolean }>('/auth/otp/verify', { email, code });
      const { access_token, is_new_user } = tokenRes.data;
      localStorage.setItem('token', access_token);

      const meRes = await api.get<UserResponse>('/auth/me');
      login({
        id: String(meRes.data.id),
        username: meRes.data.username,
        email: meRes.data.email,
        points: meRes.data.points,
        role: meRes.data.role || 'user',
        token: access_token,
      });
      return { isNewUser: is_new_user };
    },
    onSuccess: ({ isNewUser }) => {
      router.push(isNewUser ? '/markets?welcome=1' : '/markets');
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

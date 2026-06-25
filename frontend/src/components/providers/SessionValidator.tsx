'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/lib/stores/app-store';
import api from '@/lib/api/client';

export function SessionValidator() {
  const { isLoggedIn, login, logout } = useAppStore();

  useEffect(() => {
    if (!isLoggedIn) return;
    const token = localStorage.getItem('token');
    if (!token) {
      logout();
      return;
    }

    api
      .get('/auth/me')
      .then((res) => {
        login({
          id: res.data.id,
          username: res.data.username,
          email: res.data.email,
          points: res.data.points,
          role: res.data.role,
        });
      })
      .catch(() => {
        // 401 interceptor handles redirect + logout
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}

'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useAppStore } from '@/lib/stores/app-store';
import api from '@/lib/api/client';

export function SessionValidator() {
  const { isLoggedIn, login, logout } = useAppStore();
  const pathname = usePathname();
  const lastSync = useRef(0);

  useEffect(() => {
    if (!isLoggedIn) return;
    const token = localStorage.getItem('token');
    if (!token) {
      logout();
      return;
    }

    const now = Date.now();
    if (now - lastSync.current < 30_000) return;
    lastSync.current = now;

    api
      .get('/auth/me')
      .then((res) => {
        login({
          id: res.data.id,
          username: res.data.username,
          email: res.data.email,
          points: res.data.points,
          role: res.data.role,
          token,
        });
      })
      .catch(() => {
        // 401 interceptor handles redirect + logout
      });
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}

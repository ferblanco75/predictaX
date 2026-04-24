'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/stores/app-store';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Users,
  BarChart3,
  Bot,
  TrendingUp,
  LogOut,
  Shield,
  ChevronLeft,
  Gauge,
  Activity,
} from 'lucide-react';

const navItems = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Usuarios', icon: Users },
  { href: '/admin/markets', label: 'Mercados', icon: TrendingUp },
  { href: '/admin/predictions', label: 'Predicciones', icon: BarChart3 },
  { href: '/admin/ai', label: 'AI / LLM', icon: Bot },
  { href: '/admin/performance', label: 'Performance', icon: Gauge },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoggedIn, logout } = useAppStore();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (!isLoggedIn || !user || user.role !== 'admin') {
      router.push('/auth');
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAuthorized(true);
    }
  }, [isLoggedIn, user, router]);

  if (!authorized) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <Shield className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h1 className="text-xl font-bold mb-2">Acceso denegado</h1>
          <p className="text-gray-500 mb-4">
            Necesitás ser administrador para acceder a este panel.
          </p>
          <Link href="/" className="text-blue-500 hover:underline">
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col">
        {/* Logo */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-500" />
            <span className="font-bold text-lg">PredictaX Admin</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-800 space-y-1">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <ChevronLeft className="h-4 w-4" />
            Volver al sitio
          </Link>
          <button
            onClick={() => {
              logout();
              router.push('/');
            }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950 w-full"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
          <div className="px-3 py-2 text-xs text-gray-400">{user?.email}</div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}

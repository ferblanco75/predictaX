'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import { Home, BarChart3, Trophy, UserPlus, User } from 'lucide-react';
import { useAppStore } from '@/lib/stores/app-store';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  icon: LucideIcon;
  label: string;
  match?: string;
  requiresAuth?: boolean;
  authAware?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/', icon: Home, label: 'Inicio' },
  { href: '/markets', icon: BarChart3, label: 'Mercados' },
  { href: '/markets?categoria=mundial', icon: Trophy, label: 'Mundial', match: 'mundial' },
  { href: '/referrals', icon: UserPlus, label: 'Invitar', requiresAuth: true },
  { href: '/auth', icon: User, label: 'Cuenta', authAware: true },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const { isLoggedIn } = useAppStore();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 border-t border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-950/95 backdrop-blur-md md:hidden safe-bottom">
      <div className="flex items-center justify-around h-14">
        {NAV_ITEMS.map((item) => {
          if (item.requiresAuth && !isLoggedIn) return null;

          const isActive =
            item.href === '/'
              ? pathname === '/'
              : item.match
                ? pathname.includes(item.match) || (pathname === '/markets' && typeof window !== 'undefined' && window.location.search.includes(item.match))
                : pathname.startsWith(item.href.split('?')[0]);

          const href = item.authAware && isLoggedIn ? '/profile' : item.href;
          const label = item.authAware && isLoggedIn ? 'Perfil' : item.label;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={href}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 min-w-[56px] py-1 rounded-lg transition-colors',
                isActive
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400 active:text-gray-900 dark:active:text-gray-100'
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium leading-none">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

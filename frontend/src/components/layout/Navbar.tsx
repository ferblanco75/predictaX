'use client';

import type { FormEvent } from 'react';
import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, TrendingUp, Users, UserPlus, Trophy, Smartphone, Bitcoin, X, Coins, Shield } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useAppStore } from '@/lib/stores/app-store';
import { cn } from '@/lib/utils';
import type { MarketCategory } from '@/lib/types';
import api from '@/lib/api/client';

const categories = [
  { id: 'economia', name: 'Economía', icon: TrendingUp, color: 'bg-green-500' },
  { id: 'politica', name: 'Política', icon: Users, color: 'bg-blue-500' },
  { id: 'deportes', name: 'Deportes', icon: Trophy, color: 'bg-amber-500' },
  { id: 'tecnologia', name: 'Tecnología', icon: Smartphone, color: 'bg-violet-500' },
  { id: 'crypto', name: 'Crypto', icon: Bitcoin, color: 'bg-orange-500' },
];

export function Navbar() {
  const router = useRouter();
  const { selectedCategory, setCategory, searchQuery, setSearchQuery, isLoggedIn, user, logout, login } =
    useAppStore();

  // Refresh user data from DB on mount so points/role stay in sync after admin edits
  useEffect(() => {
    if (!isLoggedIn || !user?.token) return;
    api.get<{ points: number; role: string }>('/auth/me').then((res) => {
      login({ ...user, points: res.data.points, role: res.data.role });
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = searchQuery.trim();
    setCategory('all');
    router.push(query ? `/markets?q=${encodeURIComponent(query)}` : '/markets');
  };

  const clearSearch = () => {
    setSearchQuery('');
    router.push('/markets');
  };

  return (
    <nav
      className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50"
      role="navigation"
      aria-label="Navegación principal"
    >
      <div className="container mx-auto px-4">
        {/* Top bar */}
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2" aria-label="NeuroPredict - Inicio">
            <div
              className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg"
              aria-hidden="true"
            />
            <span className="text-xl font-bold">NeuroPredict</span>
          </Link>

          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4"
                aria-hidden="true"
              />
              <Input
                type="search"
                placeholder="Buscar mercados..."
                className="pl-10 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Buscar mercados"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
                  aria-label="Limpiar búsqueda"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </form>

          {/* Auth buttons */}
          <div className="flex items-center space-x-3">
            <ThemeToggle />
            {isLoggedIn && user ? (
              <>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                  <Coins className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <span className="text-sm font-bold text-amber-700 dark:text-amber-400">
                    {user.points.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                  </span>
                  <span className="text-xs text-amber-600 dark:text-amber-500">pts</span>
                </div>
                {user.role === 'admin' && (
                  <Link
                    href="/admin/markets"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
                    title="Panel de administración"
                  >
                    <Shield className="h-4 w-4" />
                    <span className="hidden sm:inline text-xs font-semibold">Admin</span>
                  </Link>
                )}
                <Link
                  href="/referrals"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900 transition-colors"
                  title="Invitar amigos"
                >
                  <UserPlus className="h-4 w-4" />
                  <span className="hidden sm:inline text-xs font-semibold">Invitar</span>
                </Link>
                <Link
                  href="/profile"
                  className="hidden sm:block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {user.username}
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    logout();
                    localStorage.removeItem('token');
                    sessionStorage.setItem('neuropredict_logout_reason', 'manual');
                    router.push('/auth');
                  }}
                >
                  Salir
                </Button>
              </>
            ) : (
              <>
                <Link href="/auth" className={cn(buttonVariants({ variant: 'ghost' }))}>
                  Iniciar sesión
                </Link>
                <Link href="/auth" className={cn(buttonVariants())}>
                  Registrarse
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Categories tabs */}
        <div
          className="flex items-center space-x-1 overflow-x-auto pb-2 scrollbar-hide"
          role="tablist"
          aria-label="Categorías de mercados"
        >
          <Link
            href="/markets"
            onClick={() => setCategory('all')}
            className={cn(
              buttonVariants({
                variant: selectedCategory === 'all' ? 'default' : 'ghost',
                size: 'sm',
              })
            )}
          >
            Todos
          </Link>
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <Link
                key={category.id}
                href={`/markets/category/${category.id}`}
                onClick={() => setCategory(category.id as MarketCategory)}
                className={cn(
                  buttonVariants({
                    variant: selectedCategory === category.id ? 'default' : 'ghost',
                    size: 'sm',
                  }),
                  'flex items-center space-x-2'
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{category.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

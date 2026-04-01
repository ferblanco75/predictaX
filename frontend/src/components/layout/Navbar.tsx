'use client';

import Link from 'next/link';
import { Search, TrendingUp, Users, Trophy, Smartphone, Bitcoin } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useAppStore } from '@/lib/stores/app-store';
import { cn } from '@/lib/utils';
import type { MarketCategory } from '@/lib/types';

const categories = [
  { id: 'economia', name: 'Economía', icon: TrendingUp, color: 'bg-green-500' },
  { id: 'politica', name: 'Política', icon: Users, color: 'bg-blue-500' },
  { id: 'deportes', name: 'Deportes', icon: Trophy, color: 'bg-amber-500' },
  { id: 'tecnologia', name: 'Tecnología', icon: Smartphone, color: 'bg-violet-500' },
  { id: 'crypto', name: 'Crypto', icon: Bitcoin, color: 'bg-orange-500' },
];

export function Navbar() {
  const { selectedCategory, setCategory, searchQuery, setSearchQuery, isLoggedIn, user, logout } = useAppStore();

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        {/* Top bar */}
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg" />
            <span className="text-xl font-bold">PredictaX</span>
          </Link>

          {/* Search bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="search"
                placeholder="Buscar mercados..."
                className="pl-10 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Auth buttons */}
          <div className="flex items-center space-x-3">
            <ThemeToggle />
            {isLoggedIn && user ? (
              <>
                <span className="hidden sm:block text-sm font-medium text-muted-foreground">
                  Bienvenido, <span className="text-foreground font-semibold">{user.username}</span>
                </span>
                <Button variant="outline" size="sm" onClick={() => { logout(); localStorage.removeItem('token'); }}>
                  Cerrar sesión
                </Button>
              </>
            ) : (
              <>
                <Link href="/waitlist" className={cn(buttonVariants({ variant: 'outline' }), 'hidden sm:flex')}>
                  Lista de espera
                </Link>
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
        <div className="flex items-center space-x-1 overflow-x-auto pb-2 scrollbar-hide">
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

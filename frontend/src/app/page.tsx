'use client';

import Link from 'next/link';
import { TrendingUp, Users, Trophy, Smartphone, Bitcoin, ArrowRight } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { MarketCard } from '@/components/markets/MarketCard';
import { getTrendingMarkets } from '@/lib/data';
import { categories } from '@/lib/data/categories';
import { cn } from '@/lib/utils';

export default function Home() {
  const trendingMarkets = getTrendingMarkets(6);

  const categoryIcons = {
    TrendingUp,
    Users,
    Trophy,
    Smartphone,
    Bitcoin,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 text-white">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Predice el futuro de América Latina
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              Participa en mercados de predicción sobre economía, política, deportes y más.
              Decisiones informadas con inteligencia artificial.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/markets" className={cn(buttonVariants({ size: 'lg', variant: 'secondary' }))}>
                Explorar mercados
              </Link>
              <Link
                href="/auth"
                className={cn(
                  buttonVariants({ size: 'lg', variant: 'outline' }),
                  'bg-transparent text-white border-white hover:bg-white/10'
                )}
              >
                Comenzar ahora
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold mb-8">Explora por categoría</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {categories.map((category) => {
            const Icon = categoryIcons[category.icon as keyof typeof categoryIcons];
            return (
              <Link key={category.id} href={`/markets?category=${category.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardHeader className="text-center space-y-3">
                    <div
                      className="w-12 h-12 rounded-full mx-auto flex items-center justify-center"
                      style={{ backgroundColor: `${category.color}20` }}
                    >
                      {Icon && <Icon className="h-6 w-6" style={{ color: category.color }} />}
                    </div>
                    <div>
                      <h3 className="font-semibold">{category.name}</h3>
                      <p className="text-sm text-gray-500">{category.count} mercados</p>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Featured/Trending Markets */}
      <section className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold">Mercados destacados</h2>
          <Link
            href="/markets"
            className={cn(buttonVariants({ variant: 'ghost' }), 'flex items-center space-x-2')}
          >
            <span>Ver todos</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trendingMarkets.map((market) => (
            <MarketCard key={market.id} market={market} />
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-br from-purple-600 to-blue-600 text-white">
        <div className="container mx-auto px-4 py-16 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            ¿Listo para comenzar a predecir?
          </h2>
          <p className="text-xl mb-8 text-purple-100">
            Únete a nuestra comunidad y empieza a participar en mercados de predicción.
          </p>
          <Link href="/auth" className={cn(buttonVariants({ size: 'lg', variant: 'secondary' }))}>
            Crear cuenta gratis
          </Link>
        </div>
      </section>
    </div>
  );
}

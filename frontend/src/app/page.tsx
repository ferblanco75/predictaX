'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { TrendingUp, Users, Trophy, Smartphone, Bitcoin, ArrowRight } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { MarketCard } from '@/components/markets/MarketCard';
import { MarketCardSkeleton } from '@/components/markets/MarketCardSkeleton';
import { CategoryCardSkeletonGrid } from '@/components/ui/CategoryCardSkeleton';
import { getTrendingMarkets } from '@/lib/api/markets';
import { categories } from '@/lib/data/categories';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' as const, delay: i * 0.1 },
  }),
};

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const trendingMarkets = getTrendingMarkets(6);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsLoading(true);
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, []);

  const categoryIcons = {
    TrendingUp,
    Users,
    Trophy,
    Smartphone,
    Bitcoin,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 text-white">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <motion.div className="max-w-3xl" variants={fadeInUp} initial="hidden" animate="visible">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Predice el futuro de América Latina
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              Participa en mercados de predicción sobre economía, política, deportes y más.
              Decisiones informadas con inteligencia artificial.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/markets"
                className={cn(buttonVariants({ size: 'lg', variant: 'secondary' }))}
              >
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
          </motion.div>
        </div>
      </section>

      {/* Categories Grid */}
      <motion.section
        className="container mx-auto px-4 py-12"
        variants={fadeInUp}
        custom={1}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <h2 className="text-3xl font-bold mb-8">Explora por categoría</h2>
        {isLoading ? (
          <CategoryCardSkeletonGrid />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {categories.map((category) => {
              const Icon = categoryIcons[category.icon as keyof typeof categoryIcons];
              return (
                <Link key={category.id} href={`/markets/category/${category.id}`}>
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
        )}
      </motion.section>

      {/* Featured/Trending Markets */}
      <motion.section
        className="container mx-auto px-4 py-12"
        variants={fadeInUp}
        custom={2}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
      >
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

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <MarketCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trendingMarkets.map((market) => (
              <MarketCard key={market.id} market={market} />
            ))}
          </div>
        )}
      </motion.section>

      {/* CTA Section */}
      <motion.section
        className="bg-gradient-to-br from-purple-600 to-blue-600 text-white"
        variants={fadeInUp}
        custom={3}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <div className="container mx-auto px-4 py-16 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">¿Listo para comenzar a predecir?</h2>
          <p className="text-xl mb-8 text-purple-100">
            Únete a nuestra comunidad y empieza a participar en mercados de predicción.
          </p>
          <Link href="/auth" className={cn(buttonVariants({ size: 'lg', variant: 'secondary' }))}>
            Crear cuenta gratis
          </Link>
        </div>
      </motion.section>
    </div>
  );
}

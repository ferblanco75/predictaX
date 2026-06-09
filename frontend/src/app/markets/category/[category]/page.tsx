'use client';

import { Suspense, use, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar, Trophy, LayoutGrid } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { MarketList } from '@/components/markets/MarketList';
import { MundialHero } from '@/components/markets/MundialHero';
import { FixtureCard } from '@/components/football/FixtureCard';
import { GroupsTable } from '@/components/football/GroupsTable';
import { useMarkets } from '@/lib/hooks/useMarkets';
import { useFixtures, useStandings } from '@/lib/hooks/useFootball';
import { getCategoryById } from '@/lib/data/categories';
import type { MarketCategory } from '@/lib/types';

type Tab = 'polls' | 'calendar' | 'groups';

interface CategoryPageProps {
  params: Promise<{ category: string }>;
}

function MundialTabs({ activeTab, onChange }: { activeTab: Tab; onChange: (t: Tab) => void }) {
  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'polls', label: 'Polls', icon: LayoutGrid },
    { id: 'calendar', label: 'Calendario', icon: Calendar },
    { id: 'groups', label: 'Grupos', icon: Trophy },
  ];
  return (
    <div className="flex gap-1 border-b border-gray-200 dark:border-gray-800 mb-6">
      {tabs.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
            activeTab === id
              ? 'border-green-600 text-green-700 dark:text-green-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <Icon className="h-4 w-4" />
          {label}
        </button>
      ))}
    </div>
  );
}

function CalendarTab() {
  const { data: fixtures = [], isLoading } = useFixtures();

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-14 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!fixtures.length) {
    return (
      <p className="text-center text-gray-400 py-12 text-sm">
        Calendario no disponible. Configurá <code>FOOTBALL_DATA_API_KEY</code> en el backend.
      </p>
    );
  }

  // Group by matchday
  const byMatchday = fixtures.reduce<Record<number, typeof fixtures>>((acc, f) => {
    const md = f.matchday ?? 0;
    if (!acc[md]) acc[md] = [];
    acc[md].push(f);
    return acc;
  }, {});

  const matchdays = Object.keys(byMatchday)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div className="space-y-6">
      {matchdays.map((md) => (
        <div key={md}>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
            Jornada {md}
          </h3>
          <div className="space-y-1.5">
            {byMatchday[md]
              .sort((a, b) => new Date(a.utc_date).getTime() - new Date(b.utc_date).getTime())
              .map((f) => (
                <FixtureCard key={f.id} fixture={f} />
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function GroupsTab() {
  const { data: standings = [], isLoading } = useStandings();

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-48 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!standings.length) {
    return (
      <p className="text-center text-gray-400 py-12 text-sm">
        Tabla de grupos no disponible. Configurá <code>FOOTBALL_DATA_API_KEY</code> en el backend.
      </p>
    );
  }

  return <GroupsTable standings={standings} />;
}

function CategoryContent({ categoryId }: { categoryId: MarketCategory }) {
  const category = getCategoryById(categoryId);
  const { data: markets = [], isLoading } = useMarkets({ category: categoryId, limit: 100 });
  const [activeTab, setActiveTab] = useState<Tab>('polls');

  if (!category) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-gray-500">Categoría no encontrada.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Link
          href="/markets"
          className="mb-4 inline-flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Volver a todos los mercados</span>
        </Link>

        {categoryId === 'mundial' && (
          <MundialHero featuredPolls={markets.slice(0, 3)} totalPolls={markets.length} />
        )}

        <div className="mb-6">
          <div className="flex items-center space-x-3 mb-2">
            <h1 className="text-4xl font-bold">{category.name}</h1>
            {!isLoading && (
              <Badge
                variant="secondary"
                style={{ backgroundColor: `${category.color}20`, color: category.color }}
              >
                {markets.length} {markets.length === 1 ? 'mercado' : 'mercados'}
              </Badge>
            )}
          </div>
          <p className="text-gray-600 text-lg">{category.description}</p>
        </div>

        {categoryId === 'mundial' ? (
          <>
            <MundialTabs activeTab={activeTab} onChange={setActiveTab} />
            {activeTab === 'polls' && <MarketList markets={markets} isLoading={isLoading} />}
            {activeTab === 'calendar' && <CalendarTab />}
            {activeTab === 'groups' && <GroupsTab />}
          </>
        ) : (
          <MarketList markets={markets} isLoading={isLoading} />
        )}
      </div>
    </div>
  );
}

export default function CategoryPage({ params }: CategoryPageProps) {
  const { category } = use(params);
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded animate-pulse mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    }>
      <CategoryContent categoryId={category as MarketCategory} />
    </Suspense>
  );
}

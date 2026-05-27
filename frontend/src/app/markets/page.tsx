'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Filter, Search, X } from 'lucide-react';
import { MarketList } from '@/components/markets/MarketList';
import { MundialHero } from '@/components/markets/MundialHero';
import { Card, CardContent } from '@/components/ui/card';
import { Pagination } from '@/components/ui/Pagination';
import { useMarkets } from '@/lib/hooks/useMarkets';
import { categories } from '@/lib/data/categories';
import { useAppStore } from '@/lib/stores/app-store';
import type { MarketCategory } from '@/lib/types';

const MARKETS_PER_PAGE = 12;

function MarketsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const {
    selectedCategory,
    selectedStatus,
    searchQuery,
    setCategory,
    setStatus,
    setSearchQuery,
    resetFilters,
  } = useAppStore();
  const [currentPage, setCurrentPage] = useState(1);

  // Sync category from URL param (?categoria=mundial) only for known categories.
  useEffect(() => {
    const q = searchParams.get('q') ?? '';
    setSearchQuery(q);
    setCurrentPage(1);
  }, [searchParams, setSearchQuery]);

  useEffect(() => {
    const cat = searchParams.get('categoria');
    if (!cat) return;

    const validCategory = categories.some((category) => category.id === cat);
    if (validCategory) {
      setCategory(cat as MarketCategory);
      return;
    }

    const cleanParams = new URLSearchParams(searchParams.toString());
    cleanParams.delete('categoria');
    setCategory('all');
    router.replace(cleanParams.size > 0 ? `/markets?${cleanParams.toString()}` : '/markets', {
      scroll: false,
    });
  }, [router, searchParams, setCategory]);

  const { data: allMarkets = [], isLoading } = useMarkets({
    status: selectedStatus === 'all' ? undefined : (selectedStatus as 'active' | 'resolved'),
    limit: 100,
  });

  const { data: mundialPolls = [] } = useMarkets({
    category: 'mundial' as MarketCategory,
    limit: 3,
  });

  const filtered = allMarkets.filter((m) => {
    const catMatch = selectedCategory === 'all' || m.category === selectedCategory;
    const normalizedSearch = searchQuery.trim().toLowerCase();
    const searchMatch =
      !normalizedSearch ||
      m.title.toLowerCase().includes(normalizedSearch) ||
      m.description.toLowerCase().includes(normalizedSearch);
    return catMatch && searchMatch;
  });

  const clearSearch = () => {
    const cleanParams = new URLSearchParams(searchParams.toString());
    cleanParams.delete('q');
    setSearchQuery('');
    setCurrentPage(1);
    router.replace(cleanParams.size > 0 ? `/markets?${cleanParams.toString()}` : '/markets', {
      scroll: false,
    });
  };

  const totalPages = Math.ceil(filtered.length / MARKETS_PER_PAGE);
  const safeCurrentPage = Math.min(currentPage, Math.max(totalPages, 1));
  const paginated = filtered.slice(
    (safeCurrentPage - 1) * MARKETS_PER_PAGE,
    safeCurrentPage * MARKETS_PER_PAGE
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <MundialHero featuredPolls={mundialPolls} totalPolls={14} />

        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-1">Mercados de predicción</h1>
          <p className="text-gray-500 text-sm">
            Explorá todos los polls disponibles y participá con tus predicciones
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="w-full lg:w-56 flex-shrink-0">
            <Card className="sticky top-20">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Filter className="h-4 w-4" />
                  <h2 className="font-semibold">Filtros</h2>
                </div>

                <div className="relative mb-5">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
                  <input
                    type="search"
                    placeholder="Buscar..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full pl-8 pr-9 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={clearSearch}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
                      aria-label="Limpiar búsqueda"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <div className="mb-5">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                    Categoría
                  </h3>
                  <div className="space-y-1">
                    <button
                      onClick={() => {
                        setCategory('all');
                        setCurrentPage(1);
                        router.push('/markets');
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        selectedCategory === 'all'
                          ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-400 font-medium'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      Todos
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setCategory(cat.id as MarketCategory);
                          setCurrentPage(1);
                          router.push('/markets');
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors font-medium flex items-center gap-1.5 ${
                          cat.id === 'mundial'
                            ? selectedCategory === 'mundial'
                              ? 'bg-green-600 text-white'
                              : 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900 border border-green-200 dark:border-green-800'
                            : selectedCategory === cat.id
                              ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-400'
                              : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {cat.id === 'mundial' && <span>⚽</span>}
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                    Estado
                  </h3>
                  <div className="space-y-1">
                    {[
                      { value: 'all', label: 'Todos' },
                      { value: 'active', label: 'Activos' },
                      { value: 'resolved', label: 'Resueltos' },
                    ].map((s) => (
                      <button
                        key={s.value}
                        onClick={() => {
                          setStatus(s.value as 'all' | 'active' | 'resolved');
                          setCurrentPage(1);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          selectedStatus === s.value
                            ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-400 font-medium'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {(selectedCategory !== 'all' || selectedStatus !== 'all' || searchQuery) && (
                  <button
                    onClick={() => {
                      resetFilters();
                      setCurrentPage(1);
                      router.push('/markets');
                    }}
                    className="mt-4 w-full text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 underline"
                  >
                    Limpiar filtros
                  </button>
                )}
              </CardContent>
            </Card>
          </aside>

          {/* Markets grid */}
          <div className="flex-1">
            <div className="mb-4 text-sm text-gray-500">
              {filtered.length} {filtered.length === 1 ? 'poll' : 'polls'}
              {searchQuery && (
                <span>
                  {' '}
                  para <strong>&quot;{searchQuery}&quot;</strong>
                </span>
              )}
              {selectedCategory !== 'all' && (
                <span>
                  {' '}
                  en{' '}
                  <strong>
                    {categories.find((c) => c.id === selectedCategory)?.name ?? selectedCategory}
                  </strong>
                </span>
              )}
            </div>

            <MarketList
              markets={paginated}
              isLoading={isLoading}
              onClearFilters={() => {
                resetFilters();
                setCurrentPage(1);
                router.push('/markets');
              }}
            />

            {!isLoading && totalPages > 1 && (
              <div className="mt-8">
                <Pagination
                  currentPage={safeCurrentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MarketsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-8">
            <div className="h-64 bg-green-100 dark:bg-green-950 rounded-2xl animate-pulse mb-8" />
            <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-64 animate-pulse mb-8" />
          </div>
        </div>
      }
    >
      <MarketsContent />
    </Suspense>
  );
}

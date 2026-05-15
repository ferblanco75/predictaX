'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Filter, Search } from 'lucide-react';
import { MarketList } from '@/components/markets/MarketList';
import { MundialHero } from '@/components/markets/MundialHero';
import { Card, CardContent } from '@/components/ui/card';
import { Pagination } from '@/components/ui/Pagination';
import { useMarkets } from '@/lib/hooks/useMarkets';
import { categories } from '@/lib/data/categories';
import { useAppStore } from '@/lib/stores/app-store';
import type { MarketCategory } from '@/lib/types';

const MARKETS_PER_PAGE = 12;

export default function MarketsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { selectedCategory, selectedStatus, setCategory, setStatus, resetFilters } = useAppStore();
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');

  // Sync category from URL param (?categoria=mundial)
  useEffect(() => {
    const cat = searchParams.get('categoria');
    if (cat) setCategory(cat as MarketCategory);
  }, [searchParams, setCategory]);

  // Reset page on filter change
  useEffect(() => { setCurrentPage(1); }, [selectedCategory, selectedStatus, search]);

  // Fetch all markets from backend
  const { data: allMarkets = [], isLoading } = useMarkets({
    status: selectedStatus === 'all' ? undefined : selectedStatus as 'active' | 'resolved',
    limit: 100,
  });

  // Fetch Mundial polls for hero (always, regardless of current filter)
  const { data: mundialPolls = [] } = useMarkets({ category: 'mundial' as MarketCategory, limit: 3 });

  // Client-side filter by category + search
  const filtered = allMarkets.filter((m) => {
    const catMatch = selectedCategory === 'all' || m.category === selectedCategory;
    const searchMatch = !search || m.title.toLowerCase().includes(search.toLowerCase());
    return catMatch && searchMatch;
  });

  const totalPages = Math.ceil(filtered.length / MARKETS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * MARKETS_PER_PAGE, currentPage * MARKETS_PER_PAGE);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">

        {/* Mundial Hero — always visible at top */}
        <MundialHero featuredPolls={mundialPolls} totalPolls={14} />

        {/* Page header */}
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

                {/* Search */}
                <div className="relative mb-5">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Category filter */}
                <div className="mb-5">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                    Categoría
                  </h3>
                  <div className="space-y-1">
                    <button
                      onClick={() => { setCategory('all'); router.push('/markets'); }}
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
                        onClick={() => { setCategory(cat.id as MarketCategory); router.push('/markets'); }}
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

                {/* Status filter */}
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
                        onClick={() => setStatus(s.value as 'all' | 'active' | 'resolved')}
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

                {(selectedCategory !== 'all' || selectedStatus !== 'all' || search) && (
                  <button
                    onClick={() => { resetFilters(); setSearch(''); router.push('/markets'); }}
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
              {selectedCategory !== 'all' && (
                <span> en <strong>{categories.find(c => c.id === selectedCategory)?.name ?? selectedCategory}</strong></span>
              )}
            </div>

            <MarketList
              markets={paginated}
              isLoading={isLoading}
              onClearFilters={() => { resetFilters(); setSearch(''); }}
            />

            {!isLoading && totalPages > 1 && (
              <div className="mt-8">
                <Pagination
                  currentPage={currentPage}
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

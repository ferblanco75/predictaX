'use client';

import { useState, useEffect } from 'react';
import { Filter } from 'lucide-react';
import { MarketList } from '@/components/markets/MarketList';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/ui/Pagination';
import { getAllMarkets, searchMarkets } from '@/lib/api/markets';
import { categories } from '@/lib/data/categories';
import { useAppStore } from '@/lib/stores/app-store';
import type { MarketCategory, MarketStatus } from '@/lib/types';

const MARKETS_PER_PAGE = 12;

export default function MarketsPage() {
  const { selectedCategory, selectedStatus, searchQuery, setCategory, setStatus, resetFilters } =
    useAppStore();
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Simulate initial loading (disabled for build)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsLoading(true);
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, []);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedStatus, searchQuery]);

  // Filter markets
  const filteredMarkets = (() => {
    // First apply search filter
    const searchResults = searchQuery ? searchMarkets(searchQuery) : getAllMarkets();

    // Then apply category and status filters
    return searchResults.filter((market) => {
      const categoryMatch = selectedCategory === 'all' || market.category === selectedCategory;
      const statusMatch = selectedStatus === 'all' || market.status === selectedStatus;
      return categoryMatch && statusMatch;
    });
  })();

  const allMarkets = getAllMarkets();

  // Pagination
  const totalPages = Math.ceil(filteredMarkets.length / MARKETS_PER_PAGE);
  const startIndex = (currentPage - 1) * MARKETS_PER_PAGE;
  const endIndex = startIndex + MARKETS_PER_PAGE;
  const paginatedMarkets = filteredMarkets.slice(startIndex, endIndex);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Mercados de predicción</h1>
          <p className="text-gray-600">
            Explora todos los mercados disponibles y participa con tus predicciones
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className="w-full lg:w-64 flex-shrink-0">
            <Card className="sticky top-20">
              <CardContent className="p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Filter className="h-5 w-5" />
                  <h2 className="font-semibold text-lg">Filtros</h2>
                </div>

                {/* Category filter */}
                <div className="mb-6">
                  <h3 className="font-medium text-sm mb-3 text-gray-700">Categoría</h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => setCategory('all')}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        selectedCategory === 'all'
                          ? 'bg-blue-100 text-blue-700 font-medium'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      Todos ({allMarkets.length})
                    </button>
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => setCategory(category.id)}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                          selectedCategory === category.id
                            ? 'bg-blue-100 text-blue-700 font-medium'
                            : 'hover:bg-gray-100'
                        }`}
                      >
                        {category.name} ({category.count})
                      </button>
                    ))}
                  </div>
                </div>

                {/* Status filter */}
                <div>
                  <h3 className="font-medium text-sm mb-3 text-gray-700">Estado</h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => setStatus('all')}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        selectedStatus === 'all'
                          ? 'bg-blue-100 text-blue-700 font-medium'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      Todos
                    </button>
                    <button
                      onClick={() => setStatus('active')}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        selectedStatus === 'active'
                          ? 'bg-blue-100 text-blue-700 font-medium'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      Activos
                    </button>
                    <button
                      onClick={() => setStatus('resolved')}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        selectedStatus === 'resolved'
                          ? 'bg-blue-100 text-blue-700 font-medium'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      Resueltos
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </aside>

          {/* Markets Grid */}
          <div className="flex-1">
            {/* Results count */}
            <div className="mb-6">
              <p className="text-gray-600">
                {filteredMarkets.length} {filteredMarkets.length === 1 ? 'mercado' : 'mercados'}
                {searchQuery && ` para "${searchQuery}"`}
              </p>
            </div>

            {/* Markets grid */}
            <MarketList
              markets={paginatedMarkets}
              isLoading={isLoading}
              onClearFilters={resetFilters}
            />

            {/* Pagination */}
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

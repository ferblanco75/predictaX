'use client';

import { useState } from 'react';
import { Filter } from 'lucide-react';
import { MarketCard } from '@/components/markets/MarketCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { markets, getMarketsByCategory } from '@/lib/data';
import { categories } from '@/lib/data/categories';
import type { MarketCategory, MarketStatus } from '@/lib/types';

export default function MarketsPage() {
  const [selectedCategory, setSelectedCategory] = useState<MarketCategory | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<MarketStatus | 'all'>('all');

  // Filter markets
  const filteredMarkets = markets.filter((market) => {
    const categoryMatch = selectedCategory === 'all' || market.category === selectedCategory;
    const statusMatch = selectedStatus === 'all' || market.status === selectedStatus;
    return categoryMatch && statusMatch;
  });

  return (
    <div className="min-h-screen bg-gray-50">
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
                      onClick={() => setSelectedCategory('all')}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        selectedCategory === 'all'
                          ? 'bg-blue-100 text-blue-700 font-medium'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      Todos ({markets.length})
                    </button>
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
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
                      onClick={() => setSelectedStatus('all')}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        selectedStatus === 'all'
                          ? 'bg-blue-100 text-blue-700 font-medium'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      Todos
                    </button>
                    <button
                      onClick={() => setSelectedStatus('active')}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        selectedStatus === 'active'
                          ? 'bg-blue-100 text-blue-700 font-medium'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      Activos
                    </button>
                    <button
                      onClick={() => setSelectedStatus('resolved')}
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
              </p>
            </div>

            {/* Markets grid */}
            {filteredMarkets.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredMarkets.map((market) => (
                  <MarketCard key={market.id} market={market} />
                ))}
              </div>
            ) : (
              // Empty state
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="text-gray-400 mb-4">
                    <Filter className="h-12 w-12 mx-auto" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No se encontraron mercados</h3>
                  <p className="text-gray-600 mb-4">
                    Intenta ajustar tus filtros para ver más resultados
                  </p>
                  <Button
                    onClick={() => {
                      setSelectedCategory('all');
                      setSelectedStatus('all');
                    }}
                  >
                    Limpiar filtros
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import { Filter } from 'lucide-react';
import { MarketCard } from './MarketCard';
import { MarketCardSkeletonGrid } from './MarketCardSkeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Market } from '@/lib/types';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' as const } },
};

interface MarketListProps {
  markets: Market[];
  isLoading?: boolean;
  onClearFilters?: () => void;
}

export function MarketList({ markets, isLoading = false, onClearFilters }: MarketListProps) {
  // Show loading state
  if (isLoading) {
    return <MarketCardSkeletonGrid count={9} />;
  }

  // Show market grid
  if (markets.length > 0) {
    return (
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {markets.map((market) => (
          <motion.div key={market.id} variants={itemVariants}>
            <MarketCard market={market} />
          </motion.div>
        ))}
      </motion.div>
    );
  }

  // Empty state
  return (
    <Card>
      <CardContent className="p-12 text-center">
        <div className="text-gray-400 mb-4">
          <Filter className="h-12 w-12 mx-auto" />
        </div>
        <h3 className="text-xl font-semibold mb-2">No se encontraron mercados</h3>
        <p className="text-gray-600 mb-4">
          Intenta ajustar tus filtros para ver más resultados
        </p>
        {onClearFilters && (
          <Button onClick={onClearFilters}>Limpiar filtros</Button>
        )}
      </CardContent>
    </Card>
  );
}

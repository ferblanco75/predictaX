import { Category } from '../types/market';

export const categories: Category[] = [
  {
    id: 'economia',
    name: 'Economía',
    description: 'Predicciones sobre indicadores económicos, mercados financieros y política económica de Argentina y la región',
    icon: 'TrendingUp',
    color: '#10b981', // green-500
    count: 8,
  },
  {
    id: 'politica',
    name: 'Política',
    description: 'Elecciones, reformas legislativas y eventos políticos de América Latina',
    icon: 'Users',
    color: '#3b82f6', // blue-500
    count: 8,
  },
  {
    id: 'deportes',
    name: 'Deportes',
    description: 'Resultados de fútbol, competencias internacionales y eventos deportivos',
    icon: 'Trophy',
    color: '#f59e0b', // amber-500
    count: 5,
  },
  {
    id: 'tecnologia',
    name: 'Tecnología',
    description: 'Lanzamientos de productos, IPOs tech y adopción de tecnología en la región',
    icon: 'Smartphone',
    color: '#8b5cf6', // violet-500
    count: 4,
  },
  {
    id: 'crypto',
    name: 'Crypto',
    description: 'Precios de criptomonedas y regulación en América Latina',
    icon: 'Bitcoin',
    color: '#f97316', // orange-500
    count: 3,
  },
];

export const getCategoryById = (id: string): Category | undefined => {
  return categories.find((cat) => cat.id === id);
};

export const getCategoryColor = (id: string): string => {
  return getCategoryById(id)?.color || '#6b7280';
};

'use client';

import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion } from 'framer-motion';
import type { MarketHistoryPoint } from '@/lib/types';

interface ProbabilityChartProps {
  data: MarketHistoryPoint[];
  categoryColor: string;
}

function ChartEmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="flex h-80 min-h-80 items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 text-center dark:border-gray-700 dark:bg-gray-900/40">
      <div className="max-w-sm px-6">
        <p className="font-medium text-gray-700 dark:text-gray-200">{title}</p>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{message}</p>
      </div>
    </div>
  );
}

export function ProbabilityChart({ data, categoryColor }: ProbabilityChartProps) {
  const [mounted, setMounted] = useState(false);
  const chartData = data.filter((point) => {
    const date = new Date(point.date);
    return Number.isFinite(point.probability) && !Number.isNaN(date.getTime());
  });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex h-80 min-h-80 items-center justify-center text-gray-400">
        Cargando gráfico...
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <ChartEmptyState
        title="Sin historial disponible"
        message="El gráfico aparecerá cuando el mercado tenga snapshots de probabilidad válidos."
      />
    );
  }

  if (chartData.length === 1) {
    return (
      <ChartEmptyState
        title="Historial insuficiente"
        message="Necesitamos al menos dos puntos de historial para mostrar una tendencia confiable."
      />
    );
  }

  return (
    <motion.div
      className="h-80 min-h-80 min-w-0"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tickFormatter={(value) => format(new Date(value), 'dd MMM', { locale: es })}
          />
          <YAxis domain={[0, 100]} />
          <Tooltip
            labelFormatter={(value) =>
              format(new Date(value as string), 'dd MMMM yyyy', { locale: es })
            }
            formatter={(value) => [`${value}%`, 'Probabilidad']}
          />
          <Line
            type="monotone"
            dataKey="probability"
            stroke={categoryColor}
            strokeWidth={2}
            dot={{ fill: categoryColor }}
            isAnimationActive={true}
            animationDuration={800}
            animationEasing="ease-out"
          />
        </LineChart>
      </ResponsiveContainer>
    </motion.div>
  );
}

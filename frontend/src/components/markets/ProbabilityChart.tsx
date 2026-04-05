'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion } from 'framer-motion';
import type { MarketHistoryPoint } from '@/lib/types';

interface ProbabilityChartProps {
  data: MarketHistoryPoint[];
  categoryColor: string;
}

export function ProbabilityChart({ data, categoryColor }: ProbabilityChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-80 flex items-center justify-center text-gray-400">Cargando gráfico...</div>;
  }

  return (
    <motion.div
      className="h-80"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
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

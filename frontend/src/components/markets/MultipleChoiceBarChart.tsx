'use client';

import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { MultipleChoiceOption } from '@/lib/types';

interface MultipleChoiceBarChartProps {
  options: MultipleChoiceOption[];
  categoryColor?: string;
}

interface TooltipPayloadItem {
  fill: string;
  payload: { label: string; probability: number };
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
}

// Vibrant color palette for multiple choice options
export const COLOR_PALETTE = [
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#14b8a6', // Teal
  '#f97316', // Orange
  '#06b6d4', // Cyan
  '#84cc16', // Lime
  '#6366f1', // Indigo
];

// Helper function to get color for an option by index
export const getOptionColor = (index: number): string => {
  return COLOR_PALETTE[index % COLOR_PALETTE.length];
};

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <p className="font-semibold text-sm mb-1">{data.label}</p>
        <p className="text-lg font-bold" style={{ color: payload[0].fill }}>
          {data.probability}%
        </p>
      </div>
    );
  }
  return null;
}

function ChartEmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="flex h-[400px] min-h-[400px] items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 text-center dark:border-gray-700 dark:bg-gray-900/40">
      <div className="max-w-sm px-6">
        <p className="font-medium text-gray-700 dark:text-gray-200">{title}</p>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{message}</p>
      </div>
    </div>
  );
}

export function MultipleChoiceBarChart({ options }: MultipleChoiceBarChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const validOptions = options.filter((option) => Number.isFinite(option.probability));

  if (!mounted) {
    return (
      <div className="flex h-[400px] min-h-[400px] items-center justify-center text-gray-400">
        Cargando gráfico...
      </div>
    );
  }

  if (validOptions.length === 0) {
    return (
      <ChartEmptyState
        title="Sin opciones para graficar"
        message="La distribución aparecerá cuando el mercado tenga opciones con probabilidades válidas."
      />
    );
  }

  // Sort options by probability (descending)
  const sortedOptions = [...validOptions].sort((a, b) => b.probability - a.probability);

  // Get color for each option based on its original index
  const getBarColor = (optionId: string) => {
    const originalIndex = options.findIndex((opt) => opt.id === optionId);
    return COLOR_PALETTE[originalIndex % COLOR_PALETTE.length];
  };

  return (
    <div className="h-[400px] min-h-[400px] w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={sortedOptions}
          layout="vertical"
          margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.2} />
          <XAxis
            type="number"
            domain={[0, 100]}
            unit="%"
            stroke="currentColor"
            tick={{ fill: 'currentColor', fontSize: 12 }}
          />
          <YAxis
            dataKey="label"
            type="category"
            width={150}
            stroke="currentColor"
            tick={{ fill: 'currentColor', fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }} />
          <Bar
            dataKey="probability"
            radius={[0, 8, 8, 0]}
            isAnimationActive={true}
            animationDuration={800}
            animationEasing="ease-out"
          >
            {sortedOptions.map((option) => (
              <Cell key={`cell-${option.id}`} fill={getBarColor(option.id)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

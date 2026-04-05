'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { MultipleChoiceOption } from '@/lib/types';

interface MultipleChoiceBarChartProps {
  options: MultipleChoiceOption[];
  categoryColor?: string;
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

export function MultipleChoiceBarChart({ options, categoryColor = '#3b82f6' }: MultipleChoiceBarChartProps) {
  // Sort options by probability (descending)
  const sortedOptions = [...options].sort((a, b) => b.probability - a.probability);

  // Get color for each option based on its original index
  const getBarColor = (optionId: string) => {
    const originalIndex = options.findIndex(opt => opt.id === optionId);
    return COLOR_PALETTE[originalIndex % COLOR_PALETTE.length];
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
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
  };

  return (
    <div className="w-full h-[400px]">
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
          <Bar dataKey="probability" radius={[0, 8, 8, 0]} isAnimationActive={true} animationDuration={800} animationEasing="ease-out">
            {sortedOptions.map((option) => (
              <Cell key={`cell-${option.id}`} fill={getBarColor(option.id)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

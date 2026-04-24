'use client';

import { useState, useEffect } from 'react';
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts';
import { useTheme } from 'next-themes';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';

interface ProbabilityGaugeProps {
  probability: number;
  size?: 'small' | 'large';
  showLabel?: boolean;
  animate?: boolean;
  className?: string;
}

const sizeConfig = {
  small: {
    height: 120,
    width: 160,
    textSize: 'text-3xl',
    labelSize: 'text-xs',
    innerRadius: 70,
    outerRadius: 100,
  },
  large: {
    height: 180,
    width: 280,
    textSize: 'text-5xl',
    labelSize: 'text-sm',
    innerRadius: 65,
    outerRadius: 100,
  },
};

const getProbabilityColor = (probability: number, isDark: boolean): string => {
  if (isDark) {
    if (probability < 30) return '#f87171'; // red-400
    if (probability < 50) return '#fb923c'; // orange-400
    if (probability < 70) return '#fbbf24'; // amber-400
    return '#34d399'; // green-400
  } else {
    if (probability < 30) return '#ef4444'; // red-500
    if (probability < 50) return '#f97316'; // orange-500
    if (probability < 70) return '#f59e0b'; // amber-500
    return '#10b981'; // green-500
  }
};

export function ProbabilityGauge({
  probability,
  size = 'small',
  showLabel = true,
  animate = true,
  className = '',
}: ProbabilityGaugeProps) {
  const [mounted, setMounted] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const isDark = theme === 'dark';
  const config = sizeConfig[size];

  // Colors
  const trackColor = isDark ? '#374151' : '#e5e7eb'; // gray-700 / gray-200
  const valueColor = getProbabilityColor(probability, isDark);

  // Data structure for RadialBarChart
  const data = [
    {
      name: 'value',
      value: probability,
      fill: valueColor,
    },
  ];

  if (!mounted) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{ width: config.width, height: config.height }}
      >
        <div className="text-gray-400 text-sm">Cargando...</div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} style={{ width: config.width }}>
      {/* Chart */}
      <ResponsiveContainer width="100%" height={config.height}>
        <RadialBarChart
          cx="50%"
          cy="85%" // Posicionar el centro más abajo para semicírculo
          innerRadius={`${config.innerRadius}%`}
          outerRadius={`${config.outerRadius}%`}
          barSize={15}
          data={data}
          startAngle={180}
          endAngle={0}
        >
          <RadialBar
            dataKey="value"
            cornerRadius={8}
            background={{ fill: trackColor }}
            isAnimationActive={animate}
            animationDuration={800}
            animationEasing="ease-out"
          />
        </RadialBarChart>
      </ResponsiveContainer>

      {/* Centered text overlay */}
      <div className="absolute inset-0 flex items-end justify-center pb-2">
        <div
          className="text-center"
          role="meter"
          aria-valuenow={probability}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Probabilidad: ${probability}%`}
        >
          <AnimatedNumber
            value={probability}
            decimals={0}
            suffix="%"
            className={`${config.textSize} font-bold text-gray-900 dark:text-gray-100`}
          />
          {showLabel && (
            <div className={`${config.labelSize} text-gray-500 dark:text-gray-400 mt-1`}>
              Probabilidad
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { MarketHistoryPoint } from '@/lib/types';

interface ProbabilityChartProps {
  data: MarketHistoryPoint[];
  categoryColor: string;
}

export function ProbabilityChart({ data, categoryColor }: ProbabilityChartProps) {
  return (
    <div className="h-80">
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
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

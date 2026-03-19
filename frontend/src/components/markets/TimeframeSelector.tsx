'use client';

import { Button } from '@/components/ui/button';

export type Timeframe = '1H' | '6H' | '1D' | '1W' | '1M' | 'ALL';

interface TimeframeSelectorProps {
  value: Timeframe;
  onChange: (timeframe: Timeframe) => void;
}

const timeframes: { label: string; value: Timeframe }[] = [
  { label: '1H', value: '1H' },
  { label: '6H', value: '6H' },
  { label: '1D', value: '1D' },
  { label: '1W', value: '1W' },
  { label: '1M', value: '1M' },
  { label: 'TODO', value: 'ALL' },
];

export function TimeframeSelector({ value, onChange }: TimeframeSelectorProps) {
  return (
    <div className="flex items-center space-x-2">
      {timeframes.map((tf) => (
        <Button
          key={tf.value}
          variant={value === tf.value ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onChange(tf.value)}
        >
          {tf.label}
        </Button>
      ))}
    </div>
  );
}

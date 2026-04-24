import { Skeleton } from '@/components/ui/skeleton';

interface ChartSkeletonProps {
  height?: string;
  showAxes?: boolean;
}

export function ChartSkeleton({ height = 'h-80', showAxes = true }: ChartSkeletonProps) {
  return (
    <div className={`w-full ${height} flex flex-col gap-2 p-2`}>
      {/* Bars / lines area */}
      <div className="flex-1 flex items-end gap-3 px-4">
        {[60, 80, 50, 90, 70, 85, 65, 75].map((h, i) => (
          <Skeleton key={i} className="flex-1 rounded-t-sm" style={{ height: `${h}%` }} />
        ))}
      </div>
      {/* X axis */}
      {showAxes && (
        <div className="flex gap-3 px-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Skeleton key={i} className="flex-1 h-3 rounded" />
          ))}
        </div>
      )}
    </div>
  );
}

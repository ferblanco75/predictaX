import { Card, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function CategoryCardSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader className="text-center space-y-3">
        <Skeleton className="w-12 h-12 rounded-full mx-auto" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-20 mx-auto" />
          <Skeleton className="h-3 w-16 mx-auto" />
        </div>
      </CardHeader>
    </Card>
  );
}

export function CategoryCardSkeletonGrid() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <CategoryCardSkeleton key={i} />
      ))}
    </div>
  );
}

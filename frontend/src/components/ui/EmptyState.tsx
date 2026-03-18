import { LucideIcon, MessageSquareOff, TrendingUp, FileText, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon = Package,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('py-12 px-6 text-center', className)}>
      <div className="text-gray-400 dark:text-gray-600 mb-4">
        <Icon className="h-12 w-12 mx-auto" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">{description}</p>
      {action && (
        <Button onClick={action.onClick} variant="outline">
          {action.label}
        </Button>
      )}
    </div>
  );
}

// Pre-configured empty states for common scenarios
export function EmptyPredictions() {
  return (
    <EmptyState
      icon={TrendingUp}
      title="Sin predicciones recientes"
      description="Aún no hay predicciones en este mercado. ¡Sé el primero en participar!"
    />
  );
}

export function EmptyComments() {
  return (
    <EmptyState
      icon={MessageSquareOff}
      title="Sin comentarios"
      description="No hay comentarios todavía. Inicia la conversación."
    />
  );
}

export function EmptyActivity() {
  return (
    <EmptyState
      icon={FileText}
      title="Sin actividad reciente"
      description="No hay actividad para mostrar en este momento."
    />
  );
}

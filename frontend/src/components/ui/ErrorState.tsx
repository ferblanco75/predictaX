import { AlertCircle, RefreshCcw, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  type?: 'generic' | 'network' | 'notfound';
}

export function ErrorState({
  title,
  message,
  onRetry,
  type = 'generic',
}: ErrorStateProps) {
  const config = {
    generic: {
      icon: AlertCircle,
      defaultTitle: 'Error al cargar',
      defaultMessage: 'Ocurrió un error al cargar los datos. Por favor, intenta nuevamente.',
      iconColor: 'text-red-500',
    },
    network: {
      icon: WifiOff,
      defaultTitle: 'Error de conexión',
      defaultMessage:
        'No pudimos conectar con el servidor. Verifica tu conexión a internet e intenta nuevamente.',
      iconColor: 'text-orange-500',
    },
    notfound: {
      icon: AlertCircle,
      defaultTitle: 'No encontrado',
      defaultMessage: 'El recurso que buscas no existe o no está disponible.',
      iconColor: 'text-gray-500',
    },
  };

  const { icon: Icon, defaultTitle, defaultMessage, iconColor } = config[type];

  return (
    <Card>
      <CardContent className="p-12 text-center">
        <div className={`${iconColor} mb-4`}>
          <Icon className="h-12 w-12 mx-auto" />
        </div>
        <h3 className="text-xl font-semibold mb-2">{title || defaultTitle}</h3>
        <p className="text-gray-600 mb-6">{message || defaultMessage}</p>
        {onRetry && (
          <Button onClick={onRetry}>
            <RefreshCcw className="h-4 w-4 mr-2" />
            Reintentar
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

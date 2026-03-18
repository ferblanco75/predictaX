'use client';

import Link from 'next/link';
import { FileQuestion, Home, ArrowLeft } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <CardContent className="p-12 text-center">
          <div className="text-blue-500 mb-6">
            <FileQuestion className="h-24 w-24 mx-auto" />
          </div>

          <h1 className="text-6xl font-bold text-gray-900 mb-3">404</h1>
          <h2 className="text-2xl font-semibold mb-3">Página no encontrada</h2>

          <p className="text-gray-600 mb-8">
            Lo sentimos, la página que estás buscando no existe o ha sido movida.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/" className={cn(buttonVariants({ size: 'lg' }))}>
              <Home className="h-4 w-4 mr-2" />
              Volver al inicio
            </Link>
            <Link
              href="/markets"
              className={cn(buttonVariants({ variant: 'outline', size: 'lg' }))}
            >
              Explorar mercados
            </Link>
          </div>

          <div className="mt-8 pt-8 border-t">
            <p className="text-sm text-gray-500">
              ¿Crees que esto es un error?{' '}
              <a href="mailto:soporte@predictax.com" className="text-blue-600 hover:underline">
                Contáctanos
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

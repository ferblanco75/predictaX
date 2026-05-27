'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FileQuestion, Home, Search, Shield, Trophy } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const suggestedLinks = [
  { href: '/markets', label: 'Todos los mercados' },
  { href: '/markets/category/mundial', label: 'Mundial 2026' },
  { href: '/markets/category/economia', label: 'Economía' },
  { href: '/markets/category/crypto', label: 'Crypto' },
];

export default function NotFound() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanQuery = query.trim();
    router.push(cleanQuery ? `/markets?q=${encodeURIComponent(cleanQuery)}` : '/markets');
  };

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl items-center">
        <Card className="w-full overflow-hidden border-blue-100 shadow-xl dark:border-blue-950">
          <CardContent className="grid gap-0 p-0 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="bg-gradient-to-br from-blue-950 via-blue-900 to-emerald-900 p-8 text-white md:p-12">
              <div className="mb-8 inline-flex rounded-2xl bg-white/10 p-4 ring-1 ring-white/20">
                <FileQuestion className="h-14 w-14" />
              </div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-200">404</p>
              <h1 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl">
                Esta página no existe o fue movida
              </h1>
              <p className="mt-5 text-blue-100">
                Puede que el link haya cambiado, que el mercado ya no esté disponible o que la URL
                tenga un error.
              </p>
              <div className="mt-8 flex items-center gap-3 rounded-xl bg-white/10 p-4 text-sm text-blue-100">
                <Trophy className="h-5 w-5 flex-none" />
                Los mercados del Mundial 2026 siguen disponibles desde la sección de categorías.
              </div>
            </div>

            <div className="p-8 md:p-12">
              <h2 className="text-2xl font-semibold">Buscá un mercado</h2>
              <p className="mt-2 text-muted-foreground">
                Probá con una palabra clave como Argentina, dólar, Bitcoin o Mundial.
              </p>

              <form onSubmit={handleSearch} className="mt-6 flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    className="pl-9"
                    placeholder="Buscar mercados..."
                    aria-label="Buscar mercados"
                  />
                </div>
                <Button type="submit">Buscar</Button>
              </form>

              <div className="mt-8">
                <p className="text-sm font-medium text-muted-foreground">Links sugeridos</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {suggestedLinks.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="rounded-lg border px-4 py-3 text-sm font-medium transition-colors hover:bg-muted"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/" className={cn(buttonVariants({ size: 'lg' }))}>
                  <Home className="mr-2 h-4 w-4" />
                  Volver al inicio
                </Link>
                <Link
                  href="/security-policy"
                  className={cn(buttonVariants({ variant: 'outline', size: 'lg' }))}
                >
                  <Shield className="mr-2 h-4 w-4" />
                  Reportar problema
                </Link>
              </div>

              <p className="mt-8 border-t pt-6 text-sm text-muted-foreground">
                Si creés que esto es un error, escribinos a{' '}
                <a href="mailto:soporte@neuropredict.io" className="text-blue-600 hover:underline">
                  soporte@neuropredict.io
                </a>
                .
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

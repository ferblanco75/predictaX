'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Copy, Check, Users, Coins, Share2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/lib/stores/app-store';
import api from '@/lib/api/client';

interface ReferralData {
  referral_code: string;
  referral_link: string;
  referred_count: number;
  points_earned: number;
}

export default function ReferralsPage() {
  const { isLoggedIn } = useAppStore();
  const router = useRouter();
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/auth');
      return;
    }
    api
      .get<ReferralData>('/users/me/referral')
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isLoggedIn, router]);

  const handleShare = async () => {
    if (!data) return;
    const url = data.referral_link;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Sumate a NeuroPredict',
          text: 'Registrate con mi link y ambos ganamos puntos extra.',
          url,
        });
        return;
      } catch {
        // fallback to copy
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12 max-w-lg space-y-6">
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
          <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12 max-w-lg">
          <p className="text-gray-500">No se pudo cargar tu información de referidos.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-lg space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Invitar amigos</h1>
          <p className="text-gray-500 mt-1">Compartí tu link y ambos ganan puntos extra.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tu link de referido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-3">
              <code className="flex-1 text-sm break-all select-all">{data.referral_link}</code>
              <button
                type="button"
                onClick={handleShare}
                className="shrink-0 rounded-md p-2 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
                aria-label="Copiar link"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>

            <div className="flex items-center gap-2 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 px-4 py-3 text-sm">
              <span className="font-mono font-bold text-blue-700 dark:text-blue-300">
                {data.referral_code}
              </span>
              <span className="text-blue-600 dark:text-blue-400">— tu código personal</span>
            </div>

            <Button onClick={handleShare} className="w-full" size="lg">
              <Share2 className="h-4 w-4 mr-2" />
              {copied ? 'Link copiado' : 'Compartir link'}
            </Button>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <Users className="h-8 w-8 mx-auto mb-2 text-blue-600 dark:text-blue-400" />
              <p className="text-3xl font-bold">{data.referred_count}</p>
              <p className="text-sm text-gray-500 mt-1">Amigos invitados</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Coins className="h-8 w-8 mx-auto mb-2 text-amber-500" />
              <p className="text-3xl font-bold">{data.points_earned}</p>
              <p className="text-sm text-gray-500 mt-1">Puntos ganados</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Cómo funciona</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs font-bold">
                  1
                </span>
                <span>Compartí tu link con amigos.</span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs font-bold">
                  2
                </span>
                <span>
                  Tu amigo se registra y recibe <strong>+100 puntos</strong> de bonus.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs font-bold">
                  3
                </span>
                <span>
                  Cuando tu amigo hace su primera predicción, vos recibís{' '}
                  <strong>+200 puntos</strong>.
                </span>
              </li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

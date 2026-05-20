import type { Metadata } from 'next';
import { WaitlistForm } from '@/components/waitlist/WaitlistForm';
import { canonicalUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Lista de Espera',
  description:
    'Únete a la lista de espera de PredictaX y sé uno de los primeros en acceder a nuestra plataforma de mercados de predicción.',
  alternates: {
    canonical: canonicalUrl('/waitlist'),
  },
  openGraph: {
    title: 'Únete a la lista de espera de PredictaX',
    description: 'Regístrate y accede primero a las funciones exclusivas de PredictaX',
    type: 'website',
    url: canonicalUrl('/waitlist'),
  },
};

export default function WaitlistPage() {
  return <WaitlistForm />;
}

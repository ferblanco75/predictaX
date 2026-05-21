import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { QueryProvider } from '@/components/providers/QueryProvider';
import NextTopLoader from 'nextjs-toploader';
import { GoogleAnalytics } from '@/components/analytics/GoogleAnalytics';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { canonicalUrl, SITE_URL } from '@/lib/site';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: 'PredictaX',
  title: {
    default: 'PredictaX - Predicciones Mundial 2026 y mercados de América Latina',
    template: '%s | PredictaX',
  },
  description:
    'Participa en polls y mercados de predicción del Mundial 2026, fútbol, economía, política, deportes y tecnología en América Latina.',
  keywords: [
    'Mundial 2026',
    'predicciones Mundial 2026',
    'polls Mundial 2026',
    'predicciones fútbol',
    'mercados de predicción',
    'pronósticos',
    'América Latina',
    'economía',
    'política',
    'deportes',
    'criptomonedas',
  ],
  authors: [{ name: 'PredictaX' }],
  creator: 'PredictaX',
  openGraph: {
    type: 'website',
    locale: 'es_LA',
    url: canonicalUrl('/'),
    siteName: 'PredictaX',
    title: 'PredictaX - Predicciones Mundial 2026',
    description:
      'Polls y mercados de predicción del Mundial 2026, fútbol y actualidad de América Latina.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'PredictaX - Mercados de Predicción',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PredictaX - Predicciones Mundial 2026',
    description:
      'Polls y mercados de predicción del Mundial 2026, fútbol y actualidad de América Latina.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <QueryProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <NextTopLoader
              color="#3b82f6"
              initialPosition={0.08}
              crawlSpeed={200}
              height={3}
              crawl={true}
              showSpinner={false}
              easing="ease"
              speed={200}
              shadow="0 0 10px #3b82f6,0 0 5px #3b82f6"
            />
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </ThemeProvider>
        </QueryProvider>
        <GoogleAnalytics />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}

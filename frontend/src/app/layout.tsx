import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import NextTopLoader from 'nextjs-toploader';
import { GoogleAnalytics } from '@/components/analytics/GoogleAnalytics';
import { Analytics } from '@vercel/analytics/react';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  ),
  title: {
    default: 'PredictaX - Mercados de Predicción de América Latina',
    template: '%s | PredictaX',
  },
  description:
    'Participa en mercados de predicción sobre economía, política, deportes y tecnología en América Latina. Decisiones informadas con inteligencia artificial.',
  keywords: [
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
    url: 'https://predictax.com',
    siteName: 'PredictaX',
    title: 'PredictaX - Mercados de Predicción de América Latina',
    description:
      'Participa en mercados de predicción sobre economía, política, deportes y tecnología.',
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
    title: 'PredictaX - Mercados de Predicción',
    description:
      'Participa en mercados de predicción sobre economía, política, deportes y tecnología.',
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
        <GoogleAnalytics />
        <Analytics />
      </body>
    </html>
  );
}

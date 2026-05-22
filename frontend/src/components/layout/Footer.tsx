import Link from 'next/link';
import { CookieSettingsButton } from '@/components/privacy/CookieConsentManager';

export function Footer() {
  return (
    <footer className="border-t bg-gray-50 mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and description */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg" />
              <span className="text-xl font-bold">PredictaX</span>
            </div>
            <p className="text-sm text-gray-600 max-w-md">
              Plataforma de mercados de predicción para Mundial 2026, economía, política, deportes y
              tecnología en América Latina.
            </p>
          </div>

          {/* Markets */}
          <div>
            <h3 className="font-semibold mb-3">Mercados</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <Link href="/markets/category/economia" className="hover:text-gray-900">
                  Economía
                </Link>
              </li>
              <li>
                <Link href="/markets/category/politica" className="hover:text-gray-900">
                  Política
                </Link>
              </li>
              <li>
                <Link href="/markets/category/mundial" className="hover:text-gray-900">
                  Mundial 2026
                </Link>
              </li>
              <li>
                <Link href="/markets/category/deportes" className="hover:text-gray-900">
                  Deportes
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold mb-3">Empresa</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <Link href="/about" className="hover:text-gray-900">
                  Acerca de
                </Link>
              </li>
              <li>
                <Link href="/waitlist" className="hover:text-gray-900">
                  Lista de espera
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-gray-900">
                  Términos
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-gray-900">
                  Privacidad
                </Link>
              </li>
              <li>
                <CookieSettingsButton />
              </li>
              <li>
                <Link href="/security-policy" className="hover:text-gray-900">
                  Seguridad
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t mt-8 pt-6 text-center text-sm text-gray-600">
          <p>&copy; {new Date().getFullYear()} PredictaX. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}

import Link from 'next/link';
import { CookieSettingsButton } from '@/components/privacy/CookieConsentManager';

export function Footer() {
  return (
    <footer className="border-t bg-gray-50 dark:bg-gray-950 mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and description */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg" />
              <span className="text-xl font-bold text-gray-900 dark:text-gray-100">NeuroPredict</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md">
              Plataforma de mercados de predicción sobre economía, política, deportes y
              tecnología en América Latina.
            </p>
          </div>

          {/* Markets */}
          <div>
            <h3 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">Mercados</h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>
                <Link href="/markets/category/economia" className="hover:text-gray-900 dark:hover:text-gray-100">
                  Economía
                </Link>
              </li>
              <li>
                <Link href="/markets/category/politica" className="hover:text-gray-900 dark:hover:text-gray-100">
                  Política
                </Link>
              </li>
              <li>
                <Link href="/markets/category/deportes" className="hover:text-gray-900 dark:hover:text-gray-100">
                  Deportes
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">Empresa</h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>
                <Link href="/about" className="hover:text-gray-900 dark:hover:text-gray-100">
                  Acerca de
                </Link>
              </li>
              <li>
                <Link href="/auth" className="hover:text-gray-900 dark:hover:text-gray-100">
                  Registrarse
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-gray-900 dark:hover:text-gray-100">
                  Términos
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-gray-900 dark:hover:text-gray-100">
                  Privacidad
                </Link>
              </li>
              <li>
                <Link href="/settings/privacy" className="hover:text-gray-900 dark:hover:text-gray-100">
                  Mis datos
                </Link>
              </li>
              <li>
                <CookieSettingsButton />
              </li>
              <li>
                <Link href="/security-policy" className="hover:text-gray-900 dark:hover:text-gray-100">
                  Seguridad
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t mt-8 pt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>&copy; {new Date().getFullYear()} NeuroPredict. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}

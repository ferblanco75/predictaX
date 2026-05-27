'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

import { GoogleAnalytics } from '@/components/analytics/GoogleAnalytics';
import { Button } from '@/components/ui/button';

const CONSENT_STORAGE_KEY = 'predictax_cookie_consent';
const CONSENT_VERSION = '2026-05-21';
const OPEN_SETTINGS_EVENT = 'predictax-open-cookie-settings';

type CookieConsent = {
  essential: true;
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
  version: string;
  updatedAt: string;
};

const defaultConsent: CookieConsent = {
  essential: true,
  analytics: false,
  marketing: false,
  functional: false,
  version: CONSENT_VERSION,
  updatedAt: '',
};

function buildConsent(overrides: Partial<CookieConsent>): CookieConsent {
  return {
    ...defaultConsent,
    ...overrides,
    essential: true,
    version: CONSENT_VERSION,
    updatedAt: overrides.updatedAt ?? new Date().toISOString(),
  };
}

function readConsent(): CookieConsent | null {
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<CookieConsent>;
    if (parsed.version !== CONSENT_VERSION) {
      return null;
    }

    return buildConsent({
      analytics: parsed.analytics === true,
      marketing: parsed.marketing === true,
      functional: parsed.functional === true,
      updatedAt: parsed.updatedAt,
    });
  } catch {
    return null;
  }
}

function saveConsent(consent: CookieConsent) {
  window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(consent));
  window.dispatchEvent(new Event('predictax-cookie-consent-change'));
}

async function syncConsentToBackend(consent: CookieConsent) {
  const token = window.localStorage.getItem('token');
  if (!token) {
    return;
  }

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

  try {
    await fetch(`${apiBaseUrl}/users/me/cookie-consent`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        essential: consent.essential,
        analytics: consent.analytics,
        functional: consent.functional,
        marketing: consent.marketing,
        version: consent.version,
      }),
    });
  } catch {
    // Local consent remains authoritative for blocking scripts if sync fails.
  }
}

function subscribeToConsent(onStoreChange: () => void) {
  window.addEventListener('storage', onStoreChange);
  window.addEventListener('predictax-cookie-consent-change', onStoreChange);

  return () => {
    window.removeEventListener('storage', onStoreChange);
    window.removeEventListener('predictax-cookie-consent-change', onStoreChange);
  };
}

function getConsentSnapshot() {
  return window.localStorage.getItem(CONSENT_STORAGE_KEY) ?? '';
}

function getServerConsentSnapshot() {
  return '';
}

function parseConsentSnapshot(snapshot: string): CookieConsent | null {
  if (!snapshot) {
    return null;
  }

  try {
    const parsed = JSON.parse(snapshot) as Partial<CookieConsent>;
    if (parsed.version !== CONSENT_VERSION) {
      return null;
    }

    return buildConsent({
      analytics: parsed.analytics === true,
      functional: parsed.functional === true,
      marketing: parsed.marketing === true,
      updatedAt: parsed.updatedAt,
    });
  } catch {
    return null;
  }
}

export function CookieConsentManager() {
  const consentSnapshot = useSyncExternalStore(
    subscribeToConsent,
    getConsentSnapshot,
    getServerConsentSnapshot
  );
  const consent = parseConsentSnapshot(consentSnapshot);
  const [draft, setDraft] = useState<CookieConsent>(defaultConsent);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    const openSettings = () => {
      const current = readConsent();
      setDraft(current ?? defaultConsent);
      setSettingsOpen(true);
    };

    window.addEventListener(OPEN_SETTINGS_EVENT, openSettings);
    return () => window.removeEventListener(OPEN_SETTINGS_EVENT, openSettings);
  }, []);

  const persistConsent = (nextConsent: CookieConsent) => {
    saveConsent(nextConsent);
    void syncConsentToBackend(nextConsent);
    setDraft(nextConsent);
    setSettingsOpen(false);
  };

  const showBanner = !consent || settingsOpen;
  const analyticsEnabled = consent?.analytics === true;

  return (
    <>
      {analyticsEnabled && (
        <>
          <GoogleAnalytics />
          <Analytics />
          <SpeedInsights />
        </>
      )}

      {showBanner && (
        <section
          aria-label="Preferencias de privacidad"
          className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-900/20 md:bottom-5 md:p-5"
        >
          {!settingsOpen ? (
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="max-w-2xl space-y-2">
                <p className="text-sm font-semibold text-slate-950">Privacidad y cookies</p>
                <p className="text-sm leading-6 text-slate-600">
                  Usamos almacenamiento esencial para que la plataforma funcione. Analytics,
                  medición de rendimiento y monitoreo no esencial solo se cargan si das tu
                  consentimiento. Podés cambiarlo cuando quieras desde el footer.
                </p>
                <Link href="/privacy" className="text-sm font-medium text-blue-700 hover:underline">
                  Ver política de privacidad
                </Link>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row md:shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => persistConsent(buildConsent({}))}
                >
                  Rechazar no esenciales
                </Button>
                <Button type="button" variant="outline" onClick={() => setSettingsOpen(true)}>
                  Configurar
                </Button>
                <Button
                  type="button"
                  onClick={() =>
                    persistConsent(
                      buildConsent({ analytics: true, marketing: true, functional: true })
                    )
                  }
                >
                  Aceptar todas
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-950">Configurar privacidad</p>
                <p className="text-sm leading-6 text-slate-600">
                  Las cookies esenciales están siempre activas. El resto es opcional y queda
                  guardado localmente con fecha y versión del consentimiento.
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-4">
                <label className="rounded-xl border border-slate-200 p-3 text-sm">
                  <span className="block font-medium text-slate-900">Esenciales</span>
                  <span className="mt-1 block text-slate-600">
                    Sesión, seguridad y preferencias básicas.
                  </span>
                  <input className="mt-3" type="checkbox" checked disabled readOnly />
                </label>

                <label className="rounded-xl border border-slate-200 p-3 text-sm">
                  <span className="block font-medium text-slate-900">Analytics</span>
                  <span className="mt-1 block text-slate-600">
                    Google Analytics, Vercel Analytics, Speed Insights y Sentry client-side.
                  </span>
                  <input
                    className="mt-3"
                    type="checkbox"
                    checked={draft.analytics}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, analytics: event.target.checked }))
                    }
                  />
                </label>

                <label className="rounded-xl border border-slate-200 p-3 text-sm">
                  <span className="block font-medium text-slate-900">Funcionales</span>
                  <span className="mt-1 block text-slate-600">
                    Preferencias opcionales que mejoren la experiencia.
                  </span>
                  <input
                    className="mt-3"
                    type="checkbox"
                    checked={draft.functional}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, functional: event.target.checked }))
                    }
                  />
                </label>

                <label className="rounded-xl border border-slate-200 p-3 text-sm">
                  <span className="block font-medium text-slate-900">Marketing</span>
                  <span className="mt-1 block text-slate-600">
                    Reservado para campañas futuras. No se carga tracking de marketing hoy.
                  </span>
                  <input
                    className="mt-3"
                    type="checkbox"
                    checked={draft.marketing}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, marketing: event.target.checked }))
                    }
                  />
                </label>
              </div>

              <div className="flex flex-col-reverse gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" onClick={() => setSettingsOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => persistConsent(buildConsent({}))}
                >
                  Rechazar no esenciales
                </Button>
                <Button
                  type="button"
                  onClick={() =>
                    persistConsent(
                      buildConsent({
                        analytics: draft.analytics,
                        functional: draft.functional,
                        marketing: draft.marketing,
                      })
                    )
                  }
                >
                  Guardar preferencias
                </Button>
              </div>
            </div>
          )}
        </section>
      )}
    </>
  );
}

export function CookieSettingsButton() {
  return (
    <button
      type="button"
      className="hover:text-gray-900"
      onClick={() => window.dispatchEvent(new Event(OPEN_SETTINGS_EVENT))}
    >
      Preferencias de privacidad
    </button>
  );
}

import { NextRequest, NextResponse } from 'next/server';

const SENSITIVE_QUERY_PARAMS = new Set(['email', 'nombre', 'password', 'passwordConfirm', 'razon']);
const MARKET_CATEGORIES = new Set([
  'mundial',
  'economia',
  'politica',
  'deportes',
  'tecnologia',
  'crypto',
]);

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sanitizedUrl = request.nextUrl.clone();
  let changed = false;

  if (pathname === '/auth' || pathname === '/waitlist') {
    for (const param of SENSITIVE_QUERY_PARAMS) {
      if (sanitizedUrl.searchParams.has(param)) {
        sanitizedUrl.searchParams.delete(param);
        changed = true;
      }
    }
  }

  if (pathname.startsWith('/markets')) {
    const category = sanitizedUrl.searchParams.get('categoria');
    if (category && (pathname !== '/markets' || !MARKET_CATEGORIES.has(category))) {
      sanitizedUrl.searchParams.delete('categoria');
      changed = true;
    }
  }

  if (changed) {
    return NextResponse.redirect(sanitizedUrl, 307);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/auth', '/waitlist', '/markets/:path*'],
};

const LOCALE = 'es-AR';
const MARKET_TIMEZONE = 'America/Argentina/Buenos_Aires';

/**
 * An endDate at exactly midnight UTC is a calendar date, not a moment: rendered
 * in Buenos Aires time it slid back to the previous day at 21:00, so the detail
 * header ("31 dic 2026") and the prediction panel ("30 dic 2026, 9:00 p.m.")
 * disagreed on the same page. Those dates render as their UTC day; anything with
 * a real time of day (e.g. a football fixture) renders in local time.
 */
function closesAtEndOfDay(date: Date): boolean {
  return (
    date.getUTCHours() === 0 &&
    date.getUTCMinutes() === 0 &&
    date.getUTCSeconds() === 0 &&
    date.getUTCMilliseconds() === 0
  );
}

/** Close date without the time — market cards and the detail header. */
export function formatMarketEndDate(endDate: string): string {
  const date = new Date(endDate);
  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat(LOCALE, {
    dateStyle: 'medium',
    timeZone: closesAtEndOfDay(date) ? 'UTC' : MARKET_TIMEZONE,
  }).format(date);
}

/** Same day as formatMarketEndDate, with the time when the market closes at a
 *  specific moment instead of at the end of a calendar day. */
export function formatMarketCloseDate(endDate: string): string {
  const date = new Date(endDate);
  if (Number.isNaN(date.getTime())) return 'Fecha por confirmar';
  if (closesAtEndOfDay(date)) return formatMarketEndDate(endDate);

  return new Intl.DateTimeFormat(LOCALE, {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: MARKET_TIMEZONE,
  }).format(date);
}

/** "1 participante" / "12 participantes" — the card and the detail header used
 *  to say "predicciones" and "participantes" for the same number, unpluralized. */
export function formatParticipants(participants: number): string {
  return `${participants} ${participants === 1 ? 'participante' : 'participantes'}`;
}

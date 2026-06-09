'use client';

import type { Fixture } from '@/lib/hooks/useFootball';

interface FixtureCardProps {
  fixture: Fixture;
  compact?: boolean;
}

function statusLabel(status: string) {
  if (status === 'IN_PLAY' || status === 'PAUSED') return { text: 'En curso', color: 'text-green-600 dark:text-green-400' };
  if (status === 'FINISHED' || status === 'AWARDED') return { text: 'Finalizado', color: 'text-gray-400' };
  return { text: null, color: '' };
}

export function FixtureCard({ fixture, compact = false }: FixtureCardProps) {
  const { home_team, away_team, home_team_tla, away_team_tla, home_team_crest, away_team_crest, score, status, utc_date } = fixture;
  const isScheduled = !['IN_PLAY', 'PAUSED', 'FINISHED', 'AWARDED'].includes(status);
  const isLive = status === 'IN_PLAY' || status === 'PAUSED';
  const label = statusLabel(status);

  const date = new Date(utc_date);
  const timeStr = new Intl.DateTimeFormat('es-AR', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    timeZone: 'America/Argentina/Buenos_Aires',
  }).format(date);

  return (
    <div className={`flex items-center gap-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 px-3 py-2.5 ${compact ? '' : 'shadow-sm'}`}>
      {/* Home */}
      <div className="flex items-center gap-1.5 flex-1 justify-end min-w-0">
        <span className="text-sm font-medium text-right truncate hidden sm:block">{home_team}</span>
        <span className="text-xs font-semibold text-right sm:hidden">{home_team_tla}</span>
        {home_team_crest && <img src={home_team_crest} alt="" className="h-6 w-6 object-contain shrink-0" />}
      </div>

      {/* Score / time */}
      <div className="flex flex-col items-center min-w-[64px] shrink-0">
        {isScheduled ? (
          <span className="text-xs text-gray-400 text-center whitespace-nowrap">{timeStr}</span>
        ) : (
          <div className="flex items-center gap-1">
            <span className="text-base font-bold tabular-nums">{score.home ?? 0}</span>
            <span className="text-gray-400 text-xs">–</span>
            <span className="text-base font-bold tabular-nums">{score.away ?? 0}</span>
          </div>
        )}
        {isLive && (
          <span className="flex items-center gap-0.5 text-xs text-green-600 dark:text-green-400 font-semibold mt-0.5">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
            Live
          </span>
        )}
        {!isLive && label.text && (
          <span className={`text-xs ${label.color}`}>{label.text}</span>
        )}
      </div>

      {/* Away */}
      <div className="flex items-center gap-1.5 flex-1 justify-start min-w-0">
        {away_team_crest && <img src={away_team_crest} alt="" className="h-6 w-6 object-contain shrink-0" />}
        <span className="text-sm font-medium truncate hidden sm:block">{away_team}</span>
        <span className="text-xs font-semibold sm:hidden">{away_team_tla}</span>
      </div>
    </div>
  );
}

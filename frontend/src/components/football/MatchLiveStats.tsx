'use client';

import { Clock, MapPin, User } from 'lucide-react';
import { useFixture, type Fixture } from '@/lib/hooks/useFootball';
import { Card, CardContent } from '@/components/ui/card';

interface MatchLiveStatsProps {
  fixtureId: number;
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'IN_PLAY' || status === 'PAUSED') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400 px-2.5 py-0.5 text-xs font-semibold">
        <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
        En curso
      </span>
    );
  }
  if (status === 'FINISHED' || status === 'AWARDED') {
    return (
      <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2.5 py-0.5 text-xs font-semibold">
        Finalizado
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 px-2.5 py-0.5 text-xs font-semibold">
      Programado
    </span>
  );
}

function ScoreDisplay({ fixture }: { fixture: Fixture }) {
  const { home_team, away_team, home_team_crest, away_team_crest, score, status } = fixture;
  const isScheduled = !['IN_PLAY', 'PAUSED', 'FINISHED', 'AWARDED'].includes(status);

  return (
    <div className="flex items-center justify-between gap-4 py-4">
      {/* Home team */}
      <div className="flex flex-col items-center gap-2 flex-1">
        {home_team_crest && (
          <img src={home_team_crest} alt="" className="h-12 w-12 object-contain" />
        )}
        <span className="text-sm font-semibold text-center leading-tight">{home_team}</span>
      </div>

      {/* Score */}
      <div className="flex flex-col items-center gap-1 min-w-[80px]">
        {isScheduled ? (
          <div className="text-lg font-bold text-gray-400">vs</div>
        ) : (
          <div className="text-4xl font-extrabold tabular-nums">
            <span className={score.home != null && score.away != null && score.home > score.away ? 'text-green-600 dark:text-green-400' : ''}>
              {score.home ?? 0}
            </span>
            <span className="text-gray-400 mx-1">–</span>
            <span className={score.home != null && score.away != null && score.away > score.home ? 'text-green-600 dark:text-green-400' : ''}>
              {score.away ?? 0}
            </span>
          </div>
        )}
        <StatusBadge status={status} />
      </div>

      {/* Away team */}
      <div className="flex flex-col items-center gap-2 flex-1">
        {away_team_crest && (
          <img src={away_team_crest} alt="" className="h-12 w-12 object-contain" />
        )}
        <span className="text-sm font-semibold text-center leading-tight">{away_team}</span>
      </div>
    </div>
  );
}

export function MatchLiveStats({ fixtureId }: MatchLiveStatsProps) {
  const { data: fixture, isLoading, isError } = useFixture(fixtureId);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="h-24 animate-pulse bg-gray-100 dark:bg-gray-800 rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  if (isError || !fixture) return null;

  const isFinished = fixture.status === 'FINISHED' || fixture.status === 'AWARDED';
  const scheduledDate = new Date(fixture.utc_date);
  const dateStr = new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/Argentina/Buenos_Aires',
  }).format(scheduledDate);

  const stageName: Record<string, string> = {
    GROUP_STAGE: 'Fase de grupos',
    ROUND_OF_16: 'Octavos de final',
    QUARTER_FINALS: 'Cuartos de final',
    SEMI_FINALS: 'Semifinales',
    FINAL: 'Final',
    THIRD_PLACE: 'Tercer puesto',
  };

  return (
    <Card className="border-green-200 dark:border-green-800">
      <CardContent className="py-4 space-y-3">
        {/* Stage / date header */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            {fixture.stage ? (stageName[fixture.stage] ?? fixture.stage) : ''}
            {fixture.group ? ` · Grupo ${fixture.group.replace('GROUP_', '')}` : ''}
            {fixture.matchday ? ` · Jornada ${fixture.matchday}` : ''}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {dateStr}
          </span>
        </div>

        <ScoreDisplay fixture={fixture} />

        {/* Finished banner */}
        {isFinished && (
          <div className="rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 px-3 py-2 text-xs text-gray-600 dark:text-gray-400 text-center">
            Partido finalizado — el mercado será resuelto pronto por el equipo de NeuroPredict.
          </div>
        )}

        {/* Venue / referee */}
        {(fixture.venue || fixture.referees.length > 0) && (
          <div className="flex flex-wrap gap-3 text-xs text-gray-400 pt-1 border-t border-gray-100 dark:border-gray-800">
            {fixture.venue && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {fixture.venue}
              </span>
            )}
            {fixture.referees.length > 0 && (
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {fixture.referees[0]}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

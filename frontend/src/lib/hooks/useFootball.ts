'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api/client';

export interface Fixture {
  id: number;
  utc_date: string;
  status:
    | 'TIMED'
    | 'IN_PLAY'
    | 'PAUSED'
    | 'FINISHED'
    | 'AWARDED'
    | 'POSTPONED'
    | 'CANCELLED'
    | string;
  matchday: number | null;
  stage: string | null;
  group: string | null;
  home_team: string;
  away_team: string;
  home_team_tla: string;
  away_team_tla: string;
  home_team_crest: string | null;
  away_team_crest: string | null;
  score: { home: number | null; away: number | null };
  winner: 'HOME_TEAM' | 'AWAY_TEAM' | 'DRAW' | null;
  venue: string | null;
  referees: string[];
}

export interface StandingRow {
  position: number;
  team: string;
  team_tla: string;
  team_crest: string | null;
  played: number;
  won: number;
  draw: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_diff: number;
  points: number;
}

export interface Standing {
  stage: string;
  group: string | null;
  table: StandingRow[];
}

export function useFixtures(season = 2026) {
  return useQuery<Fixture[]>({
    queryKey: ['football-fixtures', season],
    queryFn: async () => {
      const res = await api.get<Fixture[]>(`/football/fixtures?season=${season}`);
      return res.data;
    },
    staleTime: 60_000,
    retry: false,
  });
}

export function useFixture(fixtureId: number | null | undefined) {
  const isLive = false; // will be derived after fetch
  return useQuery<Fixture>({
    queryKey: ['football-fixture', fixtureId],
    queryFn: async () => {
      const res = await api.get<Fixture>(`/football/fixtures/${fixtureId}`);
      return res.data;
    },
    enabled: !!fixtureId,
    staleTime: 55_000,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === 'IN_PLAY' || status === 'PAUSED' ? 60_000 : false;
    },
    retry: false,
  });
}

export function useStandings(season = 2026) {
  return useQuery<Standing[]>({
    queryKey: ['football-standings', season],
    queryFn: async () => {
      const res = await api.get<Standing[]>(`/football/standings?season=${season}`);
      return res.data;
    },
    staleTime: 5 * 60_000,
    retry: false,
  });
}

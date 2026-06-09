'use client';

import type { Standing } from '@/lib/hooks/useFootball';

interface GroupsTableProps {
  standings: Standing[];
}

export function GroupsTable({ standings }: GroupsTableProps) {
  if (!standings.length) return null;

  // Sort groups alphabetically by group label
  const sorted = [...standings].sort((a, b) => (a.group ?? '').localeCompare(b.group ?? ''));

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {sorted.map((standing) => {
        const groupLabel = standing.group ? `Grupo ${standing.group.replace('GROUP_', '')}` : 'Tabla';
        return (
          <div key={standing.group ?? standing.stage} className="rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
            <div className="bg-green-700 text-white text-xs font-bold uppercase tracking-wide px-3 py-2">
              {groupLabel}
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900 text-gray-500 border-b border-gray-100 dark:border-gray-800">
                  <th className="px-2 py-1.5 text-left font-medium w-5">#</th>
                  <th className="px-2 py-1.5 text-left font-medium">Equipo</th>
                  <th className="px-1 py-1.5 text-center font-medium">PJ</th>
                  <th className="px-1 py-1.5 text-center font-medium">DG</th>
                  <th className="px-1 py-1.5 text-center font-medium font-bold text-gray-700 dark:text-gray-300">Pts</th>
                </tr>
              </thead>
              <tbody>
                {standing.table.map((row, i) => (
                  <tr
                    key={row.team}
                    className={`border-b border-gray-50 dark:border-gray-900 ${i < 2 ? 'bg-green-50/50 dark:bg-green-950/20' : ''}`}
                  >
                    <td className="px-2 py-1.5 text-gray-400">{row.position}</td>
                    <td className="px-2 py-1.5">
                      <div className="flex items-center gap-1.5">
                        {row.team_crest && (
                          <img src={row.team_crest} alt={row.team_tla} className="h-4 w-4 object-contain shrink-0" />
                        )}
                        <span className="font-medium truncate" title={row.team}>{row.team_tla ?? row.team}</span>
                      </div>
                    </td>
                    <td className="px-1 py-1.5 text-center text-gray-500">{row.played}</td>
                    <td className={`px-1 py-1.5 text-center ${(row.goal_diff ?? 0) > 0 ? 'text-green-600' : (row.goal_diff ?? 0) < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                      {(row.goal_diff ?? 0) > 0 ? `+${row.goal_diff}` : row.goal_diff}
                    </td>
                    <td className="px-1 py-1.5 text-center font-bold">{row.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}

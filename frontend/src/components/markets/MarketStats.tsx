'use client';

import { TrendingUp, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface HeadToHeadRow {
  fecha?: string;
  resultado: string;
  tipo?: string;
}

interface FormaReciente {
  [team: string]: string[] | string;
  descripcion?: string;
}

interface MarketStatsProps {
  statsData: Record<string, unknown>;
}

function FormaBar({ resultados }: { resultados: string[] }) {
  const color = (r: string) => {
    if (r === 'W') return 'bg-green-500';
    if (r === 'D') return 'bg-yellow-400';
    if (r === 'L') return 'bg-red-500';
    return 'bg-gray-300 dark:bg-gray-600';
  };
  const label = (r: string) => {
    if (r === 'W') return 'G';
    if (r === 'D') return 'E';
    if (r === 'L') return 'P';
    return r;
  };
  return (
    <div className="flex gap-1">
      {resultados.map((r, i) => (
        <div
          key={i}
          className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold ${color(r)}`}
          title={r === 'W' ? 'Ganó' : r === 'D' ? 'Empató' : r === 'L' ? 'Perdió' : r}
        >
          {label(r)}
        </div>
      ))}
    </div>
  );
}

export function MarketStats({ statsData }: MarketStatsProps) {
  const headToHead = statsData.head_to_head as HeadToHeadRow[] | undefined;
  const formaReciente = statsData.forma_reciente as FormaReciente | undefined;
  const datoClave = statsData.dato_clave as string | undefined;
  const probabilidadIa = statsData.probabilidad_ia as number | undefined;
  const favoritos = statsData.favoritos as Array<{ pais: string; prob: number }> | undefined;
  const competidores = statsData.competidores as Array<{ jugador?: string; pais?: string; prob: number }> | undefined;
  const historial = (
    statsData.historial_mundiales ||
    statsData.historial_campeonatos ||
    statsData.historial_finales ||
    statsData.historial_goles_messi ||
    statsData.historial_goles_totales ||
    statsData.historial_bota_oro ||
    statsData.historial_balon_oro_mundial ||
    statsData.historial_goles_grupos ||
    statsData.historial_finales_latam
  ) as Array<Record<string, unknown>> | undefined;

  const hasContent = headToHead || formaReciente || datoClave || favoritos || competidores || historial;
  if (!hasContent) return null;

  return (
    <Card className="border-green-200 dark:border-green-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2 text-green-700 dark:text-green-400">
          <TrendingUp className="h-4 w-4" />
          Estadísticas del partido
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">

        {/* Dato clave */}
        {datoClave && (
          <div className="flex gap-2 bg-green-50 dark:bg-green-950 rounded-lg px-4 py-3">
            <Info className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-700 dark:text-green-300">{datoClave}</p>
          </div>
        )}

        {/* Forma reciente */}
        {formaReciente && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
              Forma reciente
            </h4>
            <div className="space-y-2">
              {Object.entries(formaReciente)
                .filter(([key]) => key !== 'descripcion' && key !== 'goles_ultimos_5')
                .map(([equipo, resultados]) => (
                  Array.isArray(resultados) && (
                    <div key={equipo} className="flex items-center justify-between">
                      <span className="text-sm font-medium w-36 truncate">{equipo}</span>
                      <FormaBar resultados={resultados} />
                    </div>
                  )
                ))}
              {formaReciente.descripcion && (
                <p className="text-xs text-gray-400 mt-1">{String(formaReciente.descripcion)}</p>
              )}
            </div>
          </div>
        )}

        {/* Head to head */}
        {headToHead && headToHead.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
              Head to head
            </h4>
            <div className="space-y-2">
              {headToHead.map((row, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 text-xs w-24 flex-shrink-0">{row.fecha}</span>
                  <span className="font-medium text-center flex-1">{row.resultado}</span>
                  {row.tipo && (
                    <span className="text-xs text-gray-400 text-right w-28 truncate">{row.tipo}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Historial */}
        {historial && historial.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
              Historial
            </h4>
            <div className="space-y-1.5">
              {historial.slice(0, 5).map((row, i) => {
                const año = row.año || row.mundial || row.fecha;
                const valor = row.resultado || row.goleador || row.ganador || row.fase || row.goles;
                const extra = row.goles ? `${row.goles} goles` : row.promedio ? `${row.promedio}/partido` : '';
                return (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 text-xs w-20 flex-shrink-0">{String(año)}</span>
                    <span className="font-medium flex-1 text-center">{String(valor ?? '')}</span>
                    {extra && <span className="text-xs text-gray-400 w-24 text-right">{extra}</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Favoritos / Competidores */}
        {(favoritos || competidores) && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
              {favoritos ? 'Favoritos al título' : 'Candidatos a goleador'}
            </h4>
            <div className="space-y-2">
              {(favoritos || competidores || []).slice(0, 5).map((item, i) => {
                const nombre = 'pais' in item ? item.pais : item.jugador || '';
                return (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-4">{i + 1}</span>
                    <span className="text-sm flex-1">{String(nombre)}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 rounded-full"
                          style={{ width: `${item.prob}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold w-8 text-right">{item.prob}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Probabilidad IA */}
        {probabilidadIa !== undefined && (
          <div className="border-t pt-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Probabilidad estimada por IA</span>
              <span className="text-sm font-bold text-green-600 dark:text-green-400">
                {probabilidadIa}%
              </span>
            </div>
          </div>
        )}

      </CardContent>
    </Card>
  );
}

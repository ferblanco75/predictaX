'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Users } from 'lucide-react';
import type { Market } from '@/lib/types';

// Partido inaugural: Argentina vs Arabia Saudita, 14 junio 2026, 12:00 ET
const KICKOFF = new Date('2026-06-11T20:00:00-05:00');

function useCountdown(target: Date) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const tick = () => {
      const diff = target.getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);

  return timeLeft;
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="bg-white/15 backdrop-blur-sm rounded-xl px-3 py-2 min-w-[56px] text-center border border-white/20">
        <span className="text-2xl sm:text-3xl font-bold text-white tabular-nums">
          {String(value).padStart(2, '0')}
        </span>
      </div>
      <span className="text-green-200 text-xs mt-1 uppercase tracking-wider">{label}</span>
    </div>
  );
}

interface MundialHeroProps {
  featuredPolls: Market[];
  totalPolls: number;
}

export function MundialHero({ featuredPolls, totalPolls }: MundialHeroProps) {
  const countdown = useCountdown(KICKOFF);
  const started =
    countdown.days === 0 &&
    countdown.hours === 0 &&
    countdown.minutes === 0 &&
    countdown.seconds === 0;

  return (
    <div className="relative overflow-hidden rounded-2xl mb-8">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-800 via-green-700 to-emerald-600" />
      {/* Decorative pattern */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      {/* Ball decoration */}
      <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-white/5 border border-white/10" />
      <div className="absolute -right-8 -bottom-20 w-48 h-48 rounded-full bg-white/5 border border-white/10" />

      <div className="relative px-6 py-8 sm:px-10 sm:py-10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          {/* Left: title + countdown */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">⚽</span>
              <span className="text-green-200 text-sm font-semibold uppercase tracking-widest">
                FIFA World Cup
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-1 leading-tight">
              Mundial 2026
            </h2>
            <p className="text-green-100 text-sm mb-6">
              USA · México · Canadá &nbsp;·&nbsp; {totalPolls} predicciones activas
            </p>

            {/* Countdown */}
            <div className="mb-6">
              <p className="text-green-200 text-xs uppercase tracking-wider mb-3">
                {started ? '¡El torneo ya comenzó!' : 'Inicia en'}
              </p>
              {!started && (
                <div className="flex items-end gap-3">
                  <CountdownUnit value={countdown.days} label="días" />
                  <span className="text-white/60 text-2xl font-bold mb-5">:</span>
                  <CountdownUnit value={countdown.hours} label="horas" />
                  <span className="text-white/60 text-2xl font-bold mb-5">:</span>
                  <CountdownUnit value={countdown.minutes} label="min" />
                  <span className="text-white/60 text-2xl font-bold mb-5">:</span>
                  <CountdownUnit value={countdown.seconds} label="seg" />
                </div>
              )}
            </div>

            <Link
              href="/markets/category/mundial"
              className="inline-flex items-center gap-2 bg-white text-green-800 font-semibold px-5 py-2.5 rounded-xl hover:bg-green-50 transition-colors text-sm"
            >
              Ver todos los polls
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Right: featured poll cards */}
          {featuredPolls.length > 0 && (
            <div className="flex flex-col gap-3 lg:w-80 xl:w-96">
              {featuredPolls.slice(0, 3).map((poll, i) => (
                <motion.div
                  key={poll.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Link href={`/markets/${poll.id}`}>
                    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 hover:bg-white/20 transition-colors cursor-pointer">
                      <p className="text-white text-sm font-medium line-clamp-1 mb-2">
                        {poll.title}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {/* Probability bar */}
                          <div className="w-24 h-1.5 bg-white/20 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-white rounded-full"
                              style={{ width: `${poll.probability}%` }}
                            />
                          </div>
                          <span className="text-white font-bold text-sm">{poll.probability}%</span>
                        </div>
                        <div className="flex items-center gap-1 text-green-200 text-xs">
                          <Users className="h-3 w-3" />
                          <span>{poll.participants}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

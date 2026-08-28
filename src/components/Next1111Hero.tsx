import React from 'react';
import { Sparkles, Volume2 } from 'lucide-react';
import { Grouped1111Slot, CityTimeZone } from '../types';
import { formatCountdownHuman } from '../utils/timeEngine';
import { playChimeSound } from '../utils/notifications';

interface Next1111HeroProps {
  slot: Grouped1111Slot;
  activeNow: CityTimeZone[];
  userTimeZone: string;
  onOpenWishModal: (cityName?: string) => void;
  onOpenWidgetModal?: () => void;
}

export const Next1111Hero: React.FC<Next1111HeroProps> = ({
  slot,
  activeNow,
  userTimeZone,
  onOpenWishModal,
}) => {
  const isHappeningNow = activeNow.length > 0 || slot.isCurrentActive;
  const countdownText = formatCountdownHuman(slot.remainingMs);

  return (
    <section className="relative overflow-hidden rounded-3xl bg-neutral-900/90 border border-neutral-800 p-6 md:p-8 lg:p-10 shadow-2xl backdrop-blur-md">
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />

      {/* 11:11 Live Moment Celebration Banner */}
      {isHappeningNow && (
        <div className="mb-8 rounded-2xl bg-gradient-to-r from-amber-500/25 via-amber-400/35 to-amber-500/25 border border-amber-400/60 p-4 flex flex-col sm:flex-row items-center justify-between gap-4 animate-pulse shadow-lg shadow-amber-500/10">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-400 text-neutral-950 flex items-center justify-center font-black text-xl shadow-md">
              ✨
            </div>
            <div>
              <div className="font-display font-black text-amber-200 text-base sm:text-lg flex items-center gap-2">
                11:11 IS LIVE RIGHT NOW!
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              </div>
              <p className="text-xs sm:text-sm text-amber-300/90 mt-0.5">
                Currently 11:11 in {activeNow.map((c) => `${c.name} ${c.flag}`).join(', ') || slot.cityNames.join(', ')}. Make your wish before the minute ends!
              </p>
            </div>
          </div>
          <button
            id="btn-hero-active-wish"
            onClick={() => {
              playChimeSound();
              onOpenWishModal(activeNow[0]?.name || slot.cityNames[0]);
            }}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-sm shadow-lg shadow-amber-400/30 transition-transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-neutral-950" />
            Make a Wish Now
          </button>
        </div>
      )}

      {/* Main Centered Hero Layout */}
      <div className="text-center max-w-4xl mx-auto space-y-5">
        {/* Eyebrow Label */}
        <div className="text-[11px] font-bold tracking-[0.25em] text-neutral-400 uppercase">
          NEXT 11:11 IN...
        </div>

        {/* Grouped City Names */}
        <h1 className="font-display font-extrabold text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-white tracking-tight leading-tight md:leading-snug">
          {slot.cityNames.join(', ')}
        </h1>

        {/* Primary Timezone Identifier */}
        <div className="text-xs sm:text-sm font-medium text-neutral-400 font-mono tracking-wide">
          {slot.primaryTz}
        </div>

        {/* Main Countdown Display */}
        <div className="py-2 sm:py-3">
          <div className="font-display font-black text-4xl sm:text-5xl md:text-6xl lg:text-7xl tracking-tight text-amber-400 drop-shadow-[0_0_25px_rgba(251,191,36,0.35)]">
            in {countdownText}
          </div>
          <div className="text-xs sm:text-sm text-neutral-400 mt-2 font-medium">
            {slot.approxMinutesText}
          </div>
        </div>

        {/* 4 Metadata Pills */}
        <div className="flex items-center justify-center gap-2 sm:gap-2.5 flex-wrap pt-2">
          <div className="px-3 py-1.5 rounded-lg bg-neutral-950/80 border border-neutral-800 text-[11px] sm:text-xs font-medium text-neutral-300 font-mono">
            {slot.gmtOffsetFormatted}
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-neutral-950/80 border border-neutral-800 text-[11px] sm:text-xs font-medium text-neutral-300">
            {slot.localPeriodFormatted}
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-neutral-950/80 border border-neutral-800 text-[11px] sm:text-xs font-medium text-neutral-300 font-mono">
            their clock now: {slot.clockNowFormatted}
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-neutral-950/80 border border-neutral-800 text-[11px] sm:text-xs font-medium text-amber-400/90 font-mono">
            {slot.utcTargetFormatted}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 flex items-center justify-center gap-3 flex-wrap">
          <button
            id="btn-hero-wish"
            onClick={() => {
              playChimeSound();
              onOpenWishModal(slot.cityNames[0]);
            }}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-transform active:scale-95 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-neutral-950" />
            Make 11:11 Wish
          </button>

          <button
            id="btn-hero-chime"
            onClick={() => playChimeSound()}
            className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-200 hover:text-white text-xs sm:text-sm font-medium border border-neutral-700 flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Volume2 className="w-4 h-4 text-amber-400" />
            Play Chime
          </button>
        </div>
      </div>
    </section>
  );
};

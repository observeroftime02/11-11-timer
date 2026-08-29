import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Sparkles, Volume2, ChevronLeft, ChevronRight, History, Clock, RotateCcw } from 'lucide-react';
import { GroupedMomentSlot, CityTimeZone, TrackerMode } from '../types';
import { formatCountdownHuman, formatElapsedHuman } from '../utils/timeEngine';
import { playChimeSound } from '../utils/notifications';

interface Next1111HeroProps {
  slot: GroupedMomentSlot;
  activeNow: CityTimeZone[];
  userTimeZone: string;
  onOpenWishModal: (cityName?: string) => void;
  mode?: TrackerMode;
  pastSlots?: GroupedMomentSlot[];
  upcomingSlots?: GroupedMomentSlot[];
}

export const Next1111Hero: React.FC<Next1111HeroProps> = ({
  slot,
  activeNow,
  userTimeZone,
  onOpenWishModal,
  mode = '1111',
  pastSlots = [],
  upcomingSlots = [],
}) => {
  const is420 = mode === '420';

  // Build the combined timeline: [...pastSlots (oldest to newest), primarySlot, ...futureSlots]
  const timelineSlots = useMemo(() => {
    const past = pastSlots.slice(0, 4).reverse().map((s, idx, arr) => ({
      ...s,
      isPast: true,
      slotRelativeIndex: -(arr.length - idx), // e.g. -3, -2, -1
    }));

    const current: GroupedMomentSlot = {
      ...slot,
      isPast: false,
      slotRelativeIndex: 0,
    };

    const future = upcomingSlots.slice(1, 6).map((s, idx) => ({
      ...s,
      isPast: false,
      slotRelativeIndex: idx + 1, // e.g. +1, +2, +3
    }));

    return [...past, current, ...future];
  }, [pastSlots, slot, upcomingSlots]);

  // Find index of the primary (active next/now) slot in timelineSlots
  const primaryIndex = useMemo(() => {
    const idx = timelineSlots.findIndex((s) => s.slotRelativeIndex === 0);
    return idx >= 0 ? idx : 0;
  }, [timelineSlots]);

  // Currently viewed index in the carousel
  const [viewIndex, setViewIndex] = useState<number>(primaryIndex);

  // Sync back to primaryIndex whenever the primary slot changes (if user was on primary)
  const isViewingPrimary = viewIndex === primaryIndex;
  useEffect(() => {
    // Keep aligned with primary slot when mode or active slot updates
    setViewIndex(primaryIndex);
  }, [mode, slot.id, primaryIndex]);

  const currentSlot = timelineSlots[viewIndex] || slot;
  const isPastSlot = Boolean(currentSlot.isPast);
  const isHappeningNow = !isPastSlot && (activeNow.length > 0 || currentSlot.isCurrentActive);

  // Time text
  const timeText = isPastSlot
    ? formatElapsedHuman(currentSlot.elapsedMs ?? Math.max(0, Date.now() - currentSlot.targetDate.getTime()))
    : formatCountdownHuman(currentSlot.remainingMs);

  const handlePlaySound = () => {
    playChimeSound(is420 ? '420' : '1111');
  };

  // Touch Swipe Handling
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const minSwipeDistance = 45;

  const onTouchStart = (e: React.TouchEvent) => {
    touchEndX.current = null;
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const onTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && viewIndex < timelineSlots.length - 1) {
      // Swiped left -> move forward into future
      setViewIndex((prev) => Math.min(timelineSlots.length - 1, prev + 1));
    } else if (isRightSwipe && viewIndex > 0) {
      // Swiped right -> move backward into past
      setViewIndex((prev) => Math.max(0, prev - 1));
    }
  };

  const handlePrev = () => {
    if (viewIndex > 0) {
      setViewIndex((prev) => prev - 1);
    }
  };

  const handleNext = () => {
    if (viewIndex < timelineSlots.length - 1) {
      setViewIndex((prev) => prev + 1);
    }
  };

  const handleResetToNext = () => {
    setViewIndex(primaryIndex);
  };

  // Relative status title
  const relIdx = currentSlot.slotRelativeIndex ?? 0;
  let statusBadgeLabel = 'NEXT UPCOMING';
  if (isHappeningNow) {
    statusBadgeLabel = 'LIVE NOW';
  } else if (relIdx < 0) {
    statusBadgeLabel = relIdx === -1 ? 'LAST OCCURRENCE' : `${Math.abs(relIdx)} OCCURRENCES AGO`;
  } else if (relIdx > 0) {
    statusBadgeLabel = `UPCOMING (+${relIdx})`;
  }

  return (
    <section
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className="relative overflow-hidden rounded-3xl bg-neutral-900/90 border border-neutral-800 p-6 md:p-8 lg:p-10 shadow-2xl backdrop-blur-md transition-all select-none"
    >
      {/* Background ambient lighting */}
      <div
        className={`pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full blur-3xl transition-colors ${
          isPastSlot
            ? 'bg-blue-500/10'
            : is420
            ? 'bg-emerald-500/10'
            : 'bg-amber-500/10'
        }`}
      />
      <div className="pointer-events-none absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />

      {/* Live Moment Celebration Banner (Only when on live slot and active now) */}
      {isHappeningNow && (
        <div
          className={`mb-8 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 animate-pulse shadow-lg ${
            is420
              ? 'bg-gradient-to-r from-emerald-500/25 via-emerald-400/35 to-emerald-500/25 border border-emerald-400/60 shadow-emerald-500/10'
              : 'bg-gradient-to-r from-amber-500/25 via-amber-400/35 to-amber-500/25 border border-amber-400/60 shadow-amber-500/10'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-xl shadow-md ${
                is420 ? 'bg-emerald-400 text-neutral-950' : 'bg-amber-400 text-neutral-950'
              }`}
            >
              {is420 ? '🌿' : '✨'}
            </div>
            <div>
              <div
                className={`font-display font-black text-base sm:text-lg flex items-center gap-2 ${
                  is420 ? 'text-emerald-200' : 'text-amber-200'
                }`}
              >
                <span>{is420 ? '4:20 IS LIVE RIGHT NOW!' : '11:11 IS LIVE RIGHT NOW!'}</span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              </div>
              <p
                className={`text-xs sm:text-sm mt-0.5 ${
                  is420 ? 'text-emerald-300/90' : 'text-amber-300/90'
                }`}
              >
                Currently {is420 ? '4:20' : '11:11'} in{' '}
                {activeNow.map((c) => `${c.name} ${c.flag}`).join(', ') || currentSlot.cityNames.join(', ')}.{' '}
                {is420 ? 'Catch the moment and celebrate!' : 'Make your wish before the minute ends!'}
              </p>
            </div>
          </div>
          <button
            id="btn-hero-active-wish"
            onClick={() => {
              handlePlaySound();
              onOpenWishModal(activeNow[0]?.name || currentSlot.cityNames[0]);
            }}
            className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer text-neutral-950 ${
              is420
                ? 'bg-emerald-400 hover:bg-emerald-300 shadow-emerald-400/30'
                : 'bg-amber-400 hover:bg-amber-300 shadow-amber-400/30'
            }`}
          >
            <Sparkles className="w-4 h-4 text-neutral-950" />
            <span>{is420 ? 'Join 4:20 Vibe Now' : 'Make a Wish Now'}</span>
          </button>
        </div>
      )}

      {/* Top Carousel Navigation Bar */}
      <div className="flex items-center justify-between gap-2 mb-4">
        {/* Left Arrow (Past) */}
        <button
          id="btn-hero-prev-slot"
          onClick={handlePrev}
          disabled={viewIndex === 0}
          title="View previous / past occurrence"
          className={`p-2 sm:px-3 sm:py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-semibold transition-all cursor-pointer ${
            viewIndex > 0
              ? 'bg-neutral-800/90 hover:bg-neutral-750 text-neutral-200 border-neutral-700 hover:text-white shadow-sm'
              : 'bg-neutral-900/40 text-neutral-600 border-neutral-850 cursor-not-allowed'
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Past</span>
        </button>

        {/* Timeline Status Badge & Dots */}
        <div className="flex flex-col items-center gap-1.5">
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold tracking-wider uppercase border flex items-center gap-1.5 ${
                isHappeningNow
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse'
                  : isPastSlot
                  ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                  : relIdx === 0
                  ? is420
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                  : 'bg-neutral-800 text-neutral-400 border-neutral-700'
              }`}
            >
              {isPastSlot ? (
                <History className="w-3 h-3 text-blue-400" />
              ) : (
                <Clock className="w-3 h-3" />
              )}
              <span>{statusBadgeLabel}</span>
            </span>

            {!isViewingPrimary && (
              <button
                id="btn-hero-reset-next"
                onClick={handleResetToNext}
                className="px-2 py-0.5 rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-[10px] font-medium border border-neutral-700 flex items-center gap-1 transition-all cursor-pointer"
                title="Jump back to next upcoming occurrence"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                <span>Jump to Next</span>
              </button>
            )}
          </div>

          {/* Stepper Dots */}
          <div className="flex items-center gap-1.5">
            {timelineSlots.map((s, idx) => {
              const isSelected = idx === viewIndex;
              const isPrim = idx === primaryIndex;
              const isPastItem = Boolean(s.isPast);

              return (
                <button
                  key={s.id || idx}
                  onClick={() => setViewIndex(idx)}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    isSelected
                      ? isPastItem
                        ? 'w-6 bg-blue-400'
                        : is420
                        ? 'w-6 bg-emerald-400'
                        : 'w-6 bg-amber-400'
                      : isPrim
                      ? 'w-2.5 bg-neutral-400 hover:bg-neutral-300'
                      : 'w-1.5 bg-neutral-700 hover:bg-neutral-500'
                  }`}
                  title={
                    isPastItem
                      ? `Past occurrence (${s.cityNames[0]})`
                      : isPrim
                      ? `Next occurrence (${s.cityNames[0]})`
                      : `Future occurrence (${s.cityNames[0]})`
                  }
                />
              );
            })}
          </div>
        </div>

        {/* Right Arrow (Future) */}
        <button
          id="btn-hero-next-slot"
          onClick={handleNext}
          disabled={viewIndex === timelineSlots.length - 1}
          title="View upcoming future occurrence"
          className={`p-2 sm:px-3 sm:py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-semibold transition-all cursor-pointer ${
            viewIndex < timelineSlots.length - 1
              ? 'bg-neutral-800/90 hover:bg-neutral-750 text-neutral-200 border-neutral-700 hover:text-white shadow-sm'
              : 'bg-neutral-900/40 text-neutral-600 border-neutral-850 cursor-not-allowed'
          }`}
        >
          <span className="hidden sm:inline">Future</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Main Centered Hero Layout */}
      <div className="text-center max-w-4xl mx-auto space-y-5">
        {/* Eyebrow Label */}
        <div className="text-[11px] font-bold tracking-[0.25em] text-neutral-400 uppercase">
          {isPastSlot
            ? is420
              ? 'LAST 4:20 OCCURRENCE IN...'
              : 'LAST 11:11 OCCURRENCE IN...'
            : relIdx > 0
            ? is420
              ? `FUTURE 4:20 (+${relIdx}) IN...`
              : `FUTURE 11:11 (+${relIdx}) IN...`
            : is420
            ? 'NEXT 4:20 IN...'
            : 'NEXT 11:11 IN...'}
        </div>

        {/* Grouped City Names */}
        <h1 className="font-display font-extrabold text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-white tracking-tight leading-tight md:leading-snug transition-all">
          {currentSlot.cityNames.join(', ')}
        </h1>

        {/* Primary Timezone Identifier */}
        <div className="text-xs sm:text-sm font-medium text-neutral-400 font-mono tracking-wide">
          {currentSlot.primaryTz}
        </div>

        {/* Main Countdown / Elapsed Display */}
        <div className="py-2 sm:py-3">
          <div
            className={`font-display font-black text-4xl sm:text-5xl md:text-6xl lg:text-7xl tracking-tight transition-all ${
              isPastSlot
                ? 'text-blue-300 drop-shadow-[0_0_25px_rgba(147,197,253,0.3)]'
                : is420
                ? 'text-emerald-400 drop-shadow-[0_0_25px_rgba(52,211,153,0.35)]'
                : 'text-amber-400 drop-shadow-[0_0_25px_rgba(251,191,36,0.35)]'
            }`}
          >
            {isPastSlot ? timeText : `in ${timeText}`}
          </div>
          <div className="text-xs sm:text-sm text-neutral-400 mt-2 font-medium">
            {isPastSlot
              ? `Occurred at ${currentSlot.localPeriodFormatted}`
              : currentSlot.approxMinutesText}
          </div>
        </div>

        {/* 4 Metadata Pills */}
        <div className="flex items-center justify-center gap-2 sm:gap-2.5 flex-wrap pt-2">
          <div className="px-3 py-1.5 rounded-lg bg-neutral-950/80 border border-neutral-800 text-[11px] sm:text-xs font-medium text-neutral-300 font-mono">
            {currentSlot.gmtOffsetFormatted}
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-neutral-950/80 border border-neutral-800 text-[11px] sm:text-xs font-medium text-neutral-300">
            {currentSlot.localPeriodFormatted}
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-neutral-950/80 border border-neutral-800 text-[11px] sm:text-xs font-medium text-neutral-300 font-mono">
            their clock now: {currentSlot.clockNowFormatted}
          </div>
          <div
            className={`px-3 py-1.5 rounded-lg bg-neutral-950/80 border border-neutral-800 text-[11px] sm:text-xs font-medium font-mono ${
              isPastSlot
                ? 'text-blue-300/90'
                : is420
                ? 'text-emerald-400/90'
                : 'text-amber-400/90'
            }`}
          >
            {isPastSlot
              ? `was ${currentSlot.utcTargetFormatted}`
              : currentSlot.utcTargetFormatted}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 flex items-center justify-center gap-3 flex-wrap">
          <button
            id="btn-hero-wish"
            onClick={() => {
              handlePlaySound();
              onOpenWishModal(currentSlot.cityNames[0]);
            }}
            className={`px-6 py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg transition-transform active:scale-95 cursor-pointer text-neutral-950 ${
              isPastSlot
                ? 'bg-blue-400 hover:bg-blue-300 shadow-blue-400/20'
                : is420
                ? 'bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/20'
                : 'bg-amber-500 hover:bg-amber-400 shadow-amber-500/20'
            }`}
          >
            <Sparkles className="w-4 h-4 text-neutral-950" />
            <span>
              {isPastSlot
                ? is420
                  ? 'Record 4:20 Note'
                  : 'Make 11:11 Wish'
                : is420
                ? 'Catch 4:20 Vibe'
                : 'Make 11:11 Wish'}
            </span>
          </button>

          <button
            id="btn-hero-chime"
            onClick={handlePlaySound}
            className="px-5 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-200 hover:text-white text-xs sm:text-sm font-medium border border-neutral-700 flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Volume2
              className={`w-4 h-4 ${
                isPastSlot
                  ? 'text-blue-400'
                  : is420
                  ? 'text-emerald-400'
                  : 'text-amber-400'
              }`}
            />
            <span>{is420 ? 'Play 4:20 Tone' : 'Play Crystal Chime'}</span>
          </button>

          {/* Swipe Hint on Mobile */}
          <div className="w-full text-center text-[10px] text-neutral-500 mt-2 flex items-center justify-center gap-1.5 sm:hidden">
            <span>‹ Swipe left/right to browse past & future moments ›</span>
          </div>
        </div>
      </div>
    </section>
  );
};



import React, { useState, useMemo } from 'react';
import { Sparkles, Clock, Trash2, Plus, Heart, Filter } from 'lucide-react';
import { UserWish, CityTimeZone, TrackerMode } from '../types';
import { formatCountdownHuman } from '../utils/timeEngine';
import { WORLD_CITIES } from '../data/timezones';

interface QueuedWishesCardProps {
  wishes: UserWish[];
  currentTime: Date;
  onDeleteWish: (id: string) => void;
  onOpenWishModal: (cityName?: string) => void;
  mode?: TrackerMode;
}

type WishFilterType = 'all' | '1111' | '420';

export const QueuedWishesCard: React.FC<QueuedWishesCardProps> = ({
  wishes,
  currentTime,
  onDeleteWish,
  onOpenWishModal,
  mode = '1111',
}) => {
  const [filter, setFilter] = useState<WishFilterType>('all');

  // Counts for each category
  const count1111 = useMemo(
    () => wishes.filter((w) => (w.mode || '1111') === '1111').length,
    [wishes]
  );
  const count420 = useMemo(
    () => wishes.filter((w) => w.mode === '420').length,
    [wishes]
  );

  // Filtered list
  const filteredWishes = useMemo(() => {
    if (filter === '1111') return wishes.filter((w) => (w.mode || '1111') === '1111');
    if (filter === '420') return wishes.filter((w) => w.mode === '420');
    return wishes;
  }, [wishes, filter]);

  // If there are no wishes at all, do not render
  if (!wishes || wishes.length === 0) {
    return null;
  }

  const is420Mode = mode === '420';
  const nowMs = currentTime.getTime();

  return (
    <div
      id="card-queued-wishes"
      className="p-5 rounded-3xl border border-neutral-800 bg-neutral-900/90 shadow-2xl backdrop-blur-md space-y-4 relative overflow-hidden"
    >
      {/* Ambient background glow */}
      <div
        className={`pointer-events-none absolute -top-12 -right-12 w-48 h-48 rounded-full blur-3xl transition-colors duration-500 ${
          is420Mode ? 'bg-emerald-500/10' : 'bg-amber-500/10'
        }`}
      />

      {/* Header */}
      <div className="flex items-center justify-between gap-2 relative z-10">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-8 h-8 rounded-xl border flex items-center justify-center shadow-inner ${
              is420Mode
                ? 'bg-emerald-400/20 border-emerald-400/40 text-emerald-400'
                : 'bg-amber-400/20 border-amber-400/40 text-amber-400'
            }`}
          >
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-display font-bold text-sm text-white flex items-center gap-2">
              <span>Saved Intentions & Vault</span>
              <span className="px-2 py-0.2 rounded-full text-[10px] font-bold border bg-neutral-800 text-neutral-300 border-neutral-700">
                {wishes.length} total
              </span>
            </h3>
            <p className="text-[11px] text-neutral-400">
              Holding your 11:11 wishes & 4:20 vibes until the exact minute
            </p>
          </div>
        </div>

        <button
          id="btn-add-queued-wish"
          onClick={() => onOpenWishModal()}
          className={`p-1.5 px-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-200 border border-neutral-700 transition-all cursor-pointer text-xs flex items-center gap-1.5 shadow-sm active:scale-95`}
          title="Add new wish or vibe"
        >
          <Plus className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-[11px] font-semibold">
            {is420Mode ? '+ Add Vibe' : '+ Add Wish'}
          </span>
        </button>
      </div>

      {/* Filter Tabs (All / 11:11 Wishes / 4:20 Vibes) */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-neutral-950/80 border border-neutral-800/90 text-xs font-medium relative z-10">
        <button
          onClick={() => setFilter('all')}
          className={`flex-1 py-1.5 px-2 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer ${
            filter === 'all'
              ? 'bg-neutral-800 text-white font-bold shadow-sm'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <span>All</span>
          <span className="text-[10px] opacity-75 font-mono">({wishes.length})</span>
        </button>

        <button
          onClick={() => setFilter('1111')}
          className={`flex-1 py-1.5 px-2 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer ${
            filter === '1111'
              ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40 shadow-sm'
              : 'text-neutral-400 hover:text-amber-300'
          }`}
        >
          <span>✨ 11:11</span>
          <span className="text-[10px] opacity-75 font-mono">({count1111})</span>
        </button>

        <button
          onClick={() => setFilter('420')}
          className={`flex-1 py-1.5 px-2 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer ${
            filter === '420'
              ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40 shadow-sm'
              : 'text-neutral-400 hover:text-emerald-300'
          }`}
        >
          <span>🌿 4:20</span>
          <span className="text-[10px] opacity-75 font-mono">({count420})</span>
        </button>
      </div>

      {/* Wish List */}
      <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1 relative z-10 scrollbar-thin scrollbar-thumb-neutral-800">
        {filteredWishes.length === 0 ? (
          <div className="text-center py-6 px-4 rounded-2xl bg-neutral-950/40 border border-neutral-850 text-neutral-400 text-xs space-y-2">
            <p>No {filter === '420' ? '4:20 vibes' : '11:11 wishes'} saved yet.</p>
            <button
              onClick={() => onOpenWishModal()}
              className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-200 hover:underline cursor-pointer"
            >
              <Plus className="w-3 h-3 text-amber-400" />
              <span>Create one now</span>
            </button>
          </div>
        ) : (
          filteredWishes.map((wish) => {
            const wishMode: TrackerMode = wish.mode || '1111';
            const isWish420 = wishMode === '420';
            const targetMs = wish.targetTimestamp || nowMs;
            const diffMs = Math.max(0, targetMs - nowMs);
            const isLiveNow = diffMs <= 60000 && diffMs >= 0;
            const countdownStr = formatCountdownHuman(diffMs);

            // Lookup matching city
            const city: CityTimeZone | undefined = WORLD_CITIES.find(
              (c) => c.name.toLowerCase() === (wish.cityName || '').toLowerCase()
            );

            // Display time format: e.g. "11:11 PM" or "4:20 PM"
            const targetTimeLabel = isWish420
              ? `4:20 ${wish.period || 'PM'}`
              : `11:11 ${wish.period || 'PM'}`;

            return (
              <div
                key={wish.id}
                className={`p-3.5 rounded-2xl border transition-all flex flex-col gap-2 relative ${
                  isLiveNow
                    ? isWish420
                      ? 'bg-gradient-to-r from-emerald-500/20 via-neutral-900 to-neutral-900 border-emerald-400/80 shadow-md shadow-emerald-500/10'
                      : 'bg-gradient-to-r from-amber-500/20 via-neutral-900 to-neutral-900 border-amber-400/80 shadow-md shadow-amber-500/10'
                    : isWish420
                    ? 'bg-neutral-950/80 border-emerald-950/80 hover:border-emerald-700/60'
                    : 'bg-neutral-950/80 border-amber-950/80 hover:border-amber-700/60'
                }`}
              >
                {/* Mode Tag + Delete button */}
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      isWish420
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                    }`}
                  >
                    <span>{isWish420 ? '🌿 4:20 Vibe' : '✨ 11:11 Wish'}</span>
                    <span>•</span>
                    <span className="font-mono">{targetTimeLabel}</span>
                  </span>

                  <button
                    onClick={() => onDeleteWish(wish.id)}
                    className="text-neutral-500 hover:text-rose-400 p-1 rounded-lg hover:bg-neutral-800 transition-colors shrink-0 cursor-pointer"
                    title="Remove item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Wish Content */}
                <div className="flex items-start gap-2 min-w-0">
                  <Heart className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isWish420 ? 'text-emerald-400' : 'text-rose-400'}`} />
                  <p className="text-xs font-medium text-neutral-100 italic leading-relaxed break-words">
                    "{wish.wishText}"
                  </p>
                </div>

                {/* Bottom row: Destination & Live Countdown */}
                <div className="flex items-center justify-between gap-2 text-[11px] pt-1.5 border-t border-neutral-850">
                  <div className="flex items-center gap-1.5 text-neutral-400 min-w-0 truncate">
                    {city && <span>{city.flag}</span>}
                    <span className="font-semibold text-neutral-300 truncate">
                      {wish.cityName || (isWish420 ? 'Global 4:20' : 'Global 11:11')}
                    </span>
                    {city?.baseOffsetUtc && (
                      <span className="text-[10px] font-mono text-sky-400 px-1 py-0.2 rounded bg-neutral-900 border border-neutral-800">
                        {city.baseOffsetUtc}
                      </span>
                    )}
                  </div>

                  <div className="shrink-0 flex items-center gap-1 font-mono">
                    {isLiveNow ? (
                      <span
                        className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border animate-pulse ${
                          isWish420
                            ? 'text-emerald-300 bg-emerald-500/20 border-emerald-400/40'
                            : 'text-amber-300 bg-amber-500/20 border-amber-400/40'
                        }`}
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>{isWish420 ? 'VIBING NOW!' : 'RELEASING NOW!'}</span>
                      </span>
                    ) : (
                      <span
                        className={`flex items-center gap-1 font-bold text-xs ${
                          isWish420 ? 'text-emerald-400' : 'text-amber-400'
                        }`}
                      >
                        <Clock className="w-3 h-3 opacity-80" />
                        <span>in {countdownStr}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

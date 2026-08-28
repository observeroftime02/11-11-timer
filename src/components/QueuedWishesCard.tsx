import React from 'react';
import { Sparkles, Clock, Trash2, Plus, Heart } from 'lucide-react';
import { UserWish, CityTimeZone } from '../types';
import { formatCountdownHuman } from '../utils/timeEngine';
import { WORLD_CITIES } from '../data/timezones';

interface QueuedWishesCardProps {
  wishes: UserWish[];
  currentTime: Date;
  onDeleteWish: (id: string) => void;
  onOpenWishModal: (cityName?: string) => void;
}

export const QueuedWishesCard: React.FC<QueuedWishesCardProps> = ({
  wishes,
  currentTime,
  onDeleteWish,
  onOpenWishModal,
}) => {
  // If there are no wishes, do not render anything
  if (!wishes || wishes.length === 0) {
    return null;
  }

  const nowMs = currentTime.getTime();

  return (
    <div
      id="card-queued-wishes"
      className="p-5 rounded-3xl bg-gradient-to-br from-amber-500/10 via-neutral-900/90 to-neutral-900/90 border border-amber-500/30 shadow-2xl backdrop-blur-md space-y-4 relative overflow-hidden"
    >
      {/* Ambient background glow */}
      <div className="pointer-events-none absolute -top-12 -right-12 w-40 h-40 bg-amber-500/15 rounded-full blur-2xl" />

      {/* Header */}
      <div className="flex items-center justify-between gap-2 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-400/20 border border-amber-400/40 text-amber-400 flex items-center justify-center shadow-inner">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-display font-bold text-sm text-white flex items-center gap-2">
              <span>Queued 11:11 Wishes</span>
              <span className="px-2 py-0.2 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                {wishes.length} upcoming
              </span>
            </h3>
            <p className="text-[11px] text-neutral-400">
              Holding your intentions until 11:11 strikes
            </p>
          </div>
        </div>

        <button
          id="btn-add-queued-wish"
          onClick={() => onOpenWishModal()}
          className="p-1.5 rounded-xl bg-neutral-800 hover:bg-amber-500/20 text-neutral-300 hover:text-amber-300 border border-neutral-700 hover:border-amber-500/30 transition-all cursor-pointer text-xs flex items-center gap-1 shadow-sm"
          title="Add another 11:11 wish"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden xs:inline text-[11px] font-medium">Add Wish</span>
        </button>
      </div>

      {/* Wish List */}
      <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1 relative z-10 scrollbar-thin scrollbar-thumb-neutral-800">
        {wishes.map((wish) => {
          const targetMs = wish.targetTimestamp || nowMs;
          const diffMs = Math.max(0, targetMs - nowMs);
          const isLiveNow = diffMs <= 60000 && diffMs >= 0;
          const isExpired = targetMs > 0 && targetMs < nowMs - 60000;
          const countdownStr = formatCountdownHuman(diffMs);

          // Lookup matching city
          const city: CityTimeZone | undefined = WORLD_CITIES.find(
            (c) => c.name.toLowerCase() === (wish.cityName || '').toLowerCase()
          );

          return (
            <div
              key={wish.id}
              className={`p-3.5 rounded-2xl border transition-all flex flex-col gap-2 relative ${
                isLiveNow
                  ? 'bg-gradient-to-r from-amber-500/20 via-neutral-900 to-neutral-900 border-amber-400/80 shadow-md shadow-amber-500/10'
                  : 'bg-neutral-950/70 border-neutral-800/80 hover:border-neutral-700'
              }`}
            >
              {/* Top row: Wish text & Delete button */}
              <div className="flex items-start justify-between gap-2.5">
                <div className="flex items-start gap-2 min-w-0">
                  <Heart className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                  <p className="text-xs font-medium text-neutral-100 italic leading-relaxed break-words">
                    "{wish.wishText}"
                  </p>
                </div>
                <button
                  onClick={() => onDeleteWish(wish.id)}
                  className="text-neutral-500 hover:text-rose-400 p-1 rounded-lg hover:bg-neutral-800 transition-colors shrink-0 cursor-pointer"
                  title="Remove wish"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Bottom row: Destination & Live Countdown */}
              <div className="flex items-center justify-between gap-2 text-[11px] pt-1.5 border-t border-neutral-850">
                <div className="flex items-center gap-1.5 text-neutral-400 min-w-0 truncate">
                  {city && <span>{city.flag}</span>}
                  <span className="font-semibold text-neutral-300 truncate">
                    {wish.cityName || 'Global 11:11'}
                  </span>
                  {city?.baseOffsetUtc && (
                    <span className="text-[10px] font-mono text-sky-400 px-1 py-0.2 rounded bg-neutral-900 border border-neutral-800">
                      {city.baseOffsetUtc}
                    </span>
                  )}
                </div>

                <div className="shrink-0 flex items-center gap-1 font-mono">
                  {isLiveNow ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-400/40 animate-pulse">
                      <Sparkles className="w-3 h-3 text-amber-300" />
                      <span>RELEASING NOW!</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-amber-400 font-bold text-xs">
                      <Clock className="w-3 h-3 text-amber-400/80" />
                      <span>in {countdownStr}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

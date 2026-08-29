import React, { useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { X, Sparkles, Trash2, Heart, Clock } from 'lucide-react';
import { UserWish, TrackerMode } from '../types';
import { playChimeSound, synthesizeChillTone } from '../utils/notifications';
import { WORLD_CITIES } from '../data/timezones';
import { getNextTargetForCity, getNextTargetWorldwide } from '../utils/timeEngine';

interface MakeAWishModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCityName?: string;
  wishes?: UserWish[];
  onAddWish?: (wish: UserWish) => void;
  onDeleteWish?: (id: string) => void;
  activeMode?: TrackerMode;
}

type ModalFilterType = 'all' | '1111' | '420';
const STORAGE_KEY_WISHES = '1111_user_wishes';

export const MakeAWishModal: React.FC<MakeAWishModalProps> = ({
  isOpen,
  onClose,
  currentCityName = 'the World',
  wishes: externalWishes,
  onAddWish,
  onDeleteWish,
  activeMode = '1111',
}) => {
  const [wishText, setWishText] = useState('');
  const [internalWishes, setInternalWishes] = useState<UserWish[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [listFilter, setListFilter] = useState<ModalFilterType>('all');

  const is420 = activeMode === '420';
  const modeToUse: TrackerMode = is420 ? '420' : '1111';
  const wishes = externalWishes !== undefined ? externalWishes : internalWishes;

  useEffect(() => {
    if (externalWishes === undefined) {
      try {
        const stored = localStorage.getItem(STORAGE_KEY_WISHES);
        if (stored) setInternalWishes(JSON.parse(stored));
      } catch {
        // ignore
      }
    }
  }, [isOpen, externalWishes]);

  useEffect(() => {
    if (isOpen) {
      if (is420) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#34d399', '#10b981', '#059669', '#a7f3d0', '#6ee7b7', '#fde047'],
        });
        synthesizeChillTone();
      } else {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#fbbf24', '#fef08a', '#60a5fa', '#a78bfa', '#f472b6'],
        });
        playChimeSound();
      }
    }
  }, [isOpen, is420]);

  const count1111 = useMemo(
    () => wishes.filter((w) => (w.mode || '1111') === '1111').length,
    [wishes]
  );
  const count420 = useMemo(
    () => wishes.filter((w) => w.mode === '420').length,
    [wishes]
  );

  const filteredWishes = useMemo(() => {
    if (listFilter === '1111') return wishes.filter((w) => (w.mode || '1111') === '1111');
    if (listFilter === '420') return wishes.filter((w) => w.mode === '420');
    return wishes;
  }, [wishes, listFilter]);

  if (!isOpen) return null;

  const handleSaveWish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wishText.trim()) return;

    // Calculate target moment timestamp for the city
    const now = new Date();
    const city = WORLD_CITIES.find(
      (c) => c.name.toLowerCase() === currentCityName.toLowerCase()
    );
    let targetTimeMs: number;
    let targetPeriod: 'AM' | 'PM' = now.getHours() < 12 ? 'AM' : 'PM';

    if (city) {
      const nextEv = getNextTargetForCity(city, modeToUse, now);
      targetTimeMs = nextEv.targetDate.getTime();
      targetPeriod = nextEv.period;
    } else {
      const globalEv = getNextTargetWorldwide(WORLD_CITIES, modeToUse, now).primary;
      targetTimeMs = globalEv.targetDate.getTime();
      targetPeriod = globalEv.period;
    }

    const newWish: UserWish = {
      id: `wish-${Date.now()}`,
      wishText: wishText.trim(),
      timestamp: Date.now(),
      cityName: currentCityName,
      period: targetPeriod,
      targetTimestamp: targetTimeMs,
      mode: modeToUse,
    };

    if (onAddWish) {
      onAddWish(newWish);
    } else {
      const updated = [newWish, ...internalWishes];
      setInternalWishes(updated);
      localStorage.setItem(STORAGE_KEY_WISHES, JSON.stringify(updated));
    }

    setWishText('');
    setSubmitted(true);
    confetti({
      particleCount: 120,
      spread: 90,
      origin: { y: 0.5 },
      colors: is420
        ? ['#34d399', '#10b981', '#059669', '#3b82f6', '#f59e0b']
        : ['#fbbf24', '#f59e0b', '#10b981', '#6366f1'],
    });
    setTimeout(() => setSubmitted(false), 3000);
  };

  const handleDelete = (id: string) => {
    if (onDeleteWish) {
      onDeleteWish(id);
    } else {
      const updated = internalWishes.filter((w) => w.id !== id);
      setInternalWishes(updated);
      localStorage.setItem(STORAGE_KEY_WISHES, JSON.stringify(updated));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg rounded-3xl bg-neutral-900 border border-neutral-800 p-6 md:p-8 shadow-2xl space-y-6 overflow-hidden max-h-[90vh] flex flex-col">
        <div
          className={`pointer-events-none absolute -top-20 -right-20 w-60 h-60 rounded-full blur-3xl ${
            is420 ? 'bg-emerald-500/15' : 'bg-amber-500/15'
          }`}
        />

        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-neutral-800/80 text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors cursor-pointer z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-1.5 pt-2 shrink-0">
          <div
            className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl text-neutral-950 font-black text-xl shadow-lg mx-auto ${
              is420
                ? 'bg-gradient-to-br from-emerald-400 to-teal-500 shadow-emerald-500/30'
                : 'bg-gradient-to-br from-amber-400 to-amber-600 shadow-amber-500/30'
            }`}
          >
            {is420 ? '4:20' : '11:11'}
          </div>
          <h3 className="font-display font-black text-2xl text-white tracking-tight">
            {is420 ? 'Set a 4:20 Vibe & Intention' : 'Make an 11:11 Wish'}
          </h3>
          <p className="text-xs text-neutral-400 max-w-xs mx-auto">
            {is420
              ? `Synchronize with 4:20 in ${currentCityName}. Release your chill vibes and gratitude.`
              : `Synchronize with 11:11 in ${currentCityName}. Release your intention to the world.`}
          </p>
        </div>

        {/* Form Input */}
        <form onSubmit={handleSaveWish} className="space-y-3 shrink-0">
          <div className="relative">
            <textarea
              rows={3}
              value={wishText}
              onChange={(e) => setWishText(e.target.value)}
              placeholder={
                is420
                  ? "What's your 4:20 thought, vibe, or gratitude right now? (e.g., unwind, watch the sunset, breathe deeply...)"
                  : 'What do you wish for right now? (e.g., peace, clarity, courage, joy...)'
              }
              className={`w-full rounded-2xl bg-neutral-950 border border-neutral-800 p-4 text-xs sm:text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none transition-colors resize-none ${
                is420 ? 'focus:border-emerald-500/60' : 'focus:border-amber-500/60'
              }`}
            />
          </div>

          <button
            type="submit"
            disabled={!wishText.trim()}
            className={`w-full py-3 rounded-xl font-bold text-xs sm:text-sm shadow-lg disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer ${
              is420
                ? 'bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-neutral-950 shadow-emerald-500/20'
                : 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-neutral-950 shadow-amber-500/20'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>{is420 ? 'Lock in 4:20 Vibe into the Vault' : 'Cast 11:11 Wish into the Vault'}</span>
          </button>
        </form>

        {submitted && (
          <div
            className={`text-center text-xs font-semibold py-2 rounded-xl animate-fade-in border shrink-0 ${
              is420
                ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                : 'text-amber-400 bg-amber-500/10 border-amber-500/30'
            }`}
          >
            {is420
              ? '🌿 Your 4:20 vibe has been locked into your vault!'
              : '✨ Your 11:11 wish has been queued in your vault!'}
          </div>
        )}

        {/* Saved Wishes Vault List */}
        {wishes.length > 0 && (
          <div className="space-y-3 pt-3 border-t border-neutral-800 flex-1 overflow-hidden flex flex-col min-h-0">
            <div className="flex items-center justify-between text-xs text-neutral-400 font-semibold shrink-0">
              <span className="flex items-center gap-1.5 text-neutral-300">
                <Heart className="w-3.5 h-3.5 text-rose-400" />
                <span>Saved Intentions Vault ({wishes.length})</span>
              </span>

              {/* Segmented Filter Pills */}
              <div className="flex items-center gap-1 bg-neutral-950 p-0.5 rounded-lg border border-neutral-800 text-[11px]">
                <button
                  type="button"
                  onClick={() => setListFilter('all')}
                  className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                    listFilter === 'all'
                      ? 'bg-neutral-800 text-white font-bold'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  All ({wishes.length})
                </button>
                <button
                  type="button"
                  onClick={() => setListFilter('1111')}
                  className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                    listFilter === '1111'
                      ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                      : 'text-neutral-400 hover:text-amber-300'
                  }`}
                >
                  ✨ 11:11 ({count1111})
                </button>
                <button
                  type="button"
                  onClick={() => setListFilter('420')}
                  className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                    listFilter === '420'
                      ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40'
                      : 'text-neutral-400 hover:text-emerald-300'
                  }`}
                >
                  🌿 4:20 ({count420})
                </button>
              </div>
            </div>

            <div className="overflow-y-auto space-y-2 pr-1 scrollbar-thin flex-1 min-h-0">
              {filteredWishes.length === 0 ? (
                <div className="text-center py-4 text-xs text-neutral-500">
                  No {listFilter === '420' ? '4:20 vibes' : '11:11 wishes'} found in vault.
                </div>
              ) : (
                filteredWishes.map((w) => {
                  const isWish420 = w.mode === '420';
                  const timeLabel = isWish420
                    ? `4:20 ${w.period || 'PM'}`
                    : `11:11 ${w.period || 'PM'}`;

                  return (
                    <div
                      key={w.id}
                      className={`rounded-xl bg-neutral-950 p-3 border flex items-start justify-between gap-3 text-xs transition-colors ${
                        isWish420
                          ? 'border-emerald-950/80 hover:border-emerald-700/60'
                          : 'border-amber-950/80 hover:border-amber-700/60'
                      }`}
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${
                              isWish420
                                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                            }`}
                          >
                            {isWish420 ? '🌿 4:20' : '✨ 11:11'}
                          </span>
                          <span className="text-[10px] font-mono text-neutral-400 font-semibold">
                            {timeLabel} local
                          </span>
                        </div>
                        <p className="text-neutral-200 font-medium">"{w.wishText}"</p>
                        <p className="text-[10px] text-neutral-500 flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-neutral-600" />
                          <span>{new Date(w.timestamp).toLocaleDateString()}</span>
                          <span>•</span>
                          <span className="text-neutral-400 font-semibold">{w.cityName}</span>
                        </p>
                      </div>
                      <button
                        onClick={() => handleDelete(w.id)}
                        className="text-neutral-600 hover:text-rose-400 p-1 transition-colors cursor-pointer shrink-0"
                        title="Delete item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

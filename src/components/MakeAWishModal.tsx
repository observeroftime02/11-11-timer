import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { X, Sparkles, Trash2, Heart, Clock } from 'lucide-react';
import { UserWish } from '../types';
import { playChimeSound } from '../utils/notifications';
import { WORLD_CITIES } from '../data/timezones';
import { getNext1111ForCity, getNext1111Worldwide } from '../utils/timeEngine';

interface MakeAWishModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCityName?: string;
  wishes?: UserWish[];
  onAddWish?: (wish: UserWish) => void;
  onDeleteWish?: (id: string) => void;
}

const STORAGE_KEY_WISHES = '1111_user_wishes';

export const MakeAWishModal: React.FC<MakeAWishModalProps> = ({
  isOpen,
  onClose,
  currentCityName = 'the World',
  wishes: externalWishes,
  onAddWish,
  onDeleteWish,
}) => {
  const [wishText, setWishText] = useState('');
  const [internalWishes, setInternalWishes] = useState<UserWish[]>([]);
  const [submitted, setSubmitted] = useState(false);

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
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#fbbf24', '#fef08a', '#60a5fa', '#a78bfa', '#f472b6'],
      });
      playChimeSound();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveWish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wishText.trim()) return;

    // Calculate target 11:11 timestamp for the city
    const now = new Date();
    const city = WORLD_CITIES.find(
      (c) => c.name.toLowerCase() === currentCityName.toLowerCase()
    );
    let targetTimeMs: number;
    let targetPeriod: 'AM' | 'PM' = now.getHours() < 12 ? 'AM' : 'PM';

    if (city) {
      const nextEv = getNext1111ForCity(city, now);
      targetTimeMs = nextEv.targetDate.getTime();
      targetPeriod = nextEv.period;
    } else {
      const globalEv = getNext1111Worldwide(WORLD_CITIES, now).primary;
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
      colors: ['#fbbf24', '#f59e0b', '#10b981', '#6366f1'],
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
      <div className="relative w-full max-w-lg rounded-3xl bg-neutral-900 border border-neutral-800 p-6 md:p-8 shadow-2xl space-y-6 overflow-hidden">
        <div className="pointer-events-none absolute -top-20 -right-20 w-60 h-60 bg-amber-500/15 rounded-full blur-3xl" />

        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-neutral-800/80 text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center space-y-1.5 pt-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-neutral-950 font-black text-xl shadow-lg shadow-amber-500/30 mx-auto">
            11:11
          </div>
          <h3 className="font-display font-black text-2xl text-white tracking-tight">
            Make an 11:11 Wish
          </h3>
          <p className="text-xs text-neutral-400 max-w-xs mx-auto">
            Synchronize with 11:11 in {currentCityName}. Release your intention to the world.
          </p>
        </div>

        <form onSubmit={handleSaveWish} className="space-y-3">
          <div className="relative">
            <textarea
              rows={3}
              value={wishText}
              onChange={(e) => setWishText(e.target.value)}
              placeholder="What do you wish for right now? (e.g., peace, clarity, courage, joy...)"
              className="w-full rounded-2xl bg-neutral-950 border border-neutral-800 p-4 text-xs sm:text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-amber-500/60 transition-colors resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={!wishText.trim()}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-neutral-950 font-bold text-xs sm:text-sm shadow-lg shadow-amber-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Cast 11:11 Wish into the Vault</span>
          </button>
        </form>

        {submitted && (
          <div className="text-center text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 py-2 rounded-xl animate-fade-in">
            ✨ Your 11:11 wish has been queued in your vault!
          </div>
        )}

        {wishes.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-neutral-800">
            <div className="flex items-center justify-between text-xs text-neutral-400 font-semibold">
              <span className="flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 text-rose-400" />
                <span>Your Saved 11:11 Wishes ({wishes.length})</span>
              </span>
            </div>

            <div className="max-h-40 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
              {wishes.map((w) => (
                <div
                  key={w.id}
                  className="rounded-xl bg-neutral-950 p-3 border border-neutral-850 flex items-start justify-between gap-3 text-xs"
                >
                  <div>
                    <p className="text-neutral-200 font-medium">"{w.wishText}"</p>
                    <p className="text-[10px] text-neutral-500 mt-1 flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-neutral-600" />
                      <span>{new Date(w.timestamp).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>{w.cityName} (11:11 {w.period})</span>
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(w.id)}
                    className="text-neutral-600 hover:text-rose-400 p-1 transition-colors cursor-pointer"
                    title="Delete wish"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

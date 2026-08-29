import React from 'react';
import { BookOpen, Sparkles, Plus, ChevronRight, PenLine, Heart } from 'lucide-react';
import { JournalEntry, TrackerMode } from '../types';

interface JournalLauncherCardProps {
  entries: JournalEntry[];
  mode: TrackerMode;
  onOpenJournal: () => void;
  onNewEntry: () => void;
}

export const JournalLauncherCard: React.FC<JournalLauncherCardProps> = ({
  entries,
  mode,
  onOpenJournal,
  onNewEntry,
}) => {
  const is420 = mode === '420';
  const totalEntries = entries.length;
  const latestEntry = entries[0];

  return (
    <div
      className={`rounded-3xl p-5 md:p-6 backdrop-blur-md border transition-all shadow-xl relative overflow-hidden flex flex-col justify-between space-y-4 ${
        is420
          ? 'bg-gradient-to-br from-neutral-900/95 via-neutral-900/90 to-emerald-950/30 border-emerald-500/25 hover:border-emerald-500/40 shadow-emerald-950/20'
          : 'bg-gradient-to-br from-neutral-900/95 via-neutral-900/90 to-amber-950/30 border-amber-500/25 hover:border-amber-500/40 shadow-amber-950/20'
      }`}
    >
      {/* Background ambient accent */}
      <div
        className={`pointer-events-none absolute -top-16 -right-16 w-48 h-48 rounded-full blur-2xl ${
          is420 ? 'bg-emerald-500/10' : 'bg-amber-500/10'
        }`}
      />

      {/* Card Header */}
      <div className="flex items-start justify-between gap-3 relative z-10">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold shadow-md transition-colors ${
              is420
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
            }`}
          >
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                Mindfulness Sanctuary
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold border ${
                  is420
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                }`}
              >
                {totalEntries} {totalEntries === 1 ? 'Entry' : 'Entries'}
              </span>
            </div>
            <h3 className="font-display font-bold text-base sm:text-lg text-white mt-0.5">
              {is420 ? '🌿 Vibe Mindfulness Journal' : '✨ Wish Mindfulness Journal'}
            </h3>
          </div>
        </div>

        <button
          id="btn-journal-launcher-quick-new"
          onClick={onNewEntry}
          className={`p-2 rounded-xl border flex items-center justify-center transition-all cursor-pointer shadow-sm ${
            is420
              ? 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border-emerald-500/30 hover:border-emerald-500/50'
              : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/30 hover:border-amber-500/50'
          }`}
          title="Write a new reflection"
          aria-label="Write a new journal entry"
        >
          <PenLine className="w-4 h-4" />
        </button>
      </div>

      {/* Snippet / Prompt Area */}
      <div className="rounded-2xl bg-neutral-950/70 p-3.5 border border-neutral-800/80 relative z-10">
        {latestEntry ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-neutral-400">
              <span className="font-semibold text-neutral-200 truncate max-w-[180px]">
                {latestEntry.title || 'Untitled Reflection'}
              </span>
              <span className="font-mono text-[10px] text-neutral-500">
                {new Date(latestEntry.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
            <p className="text-xs text-neutral-300 line-clamp-2 leading-relaxed">
              "{latestEntry.content}"
            </p>
            <div className="flex items-center gap-1.5 pt-1">
              <span
                className={`px-2 py-0.5 rounded-md text-[10px] font-medium border ${
                  is420
                    ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
                    : 'bg-amber-950/60 text-amber-300 border-amber-800/60'
                }`}
              >
                {latestEntry.mood || 'Reflective'}
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-300">
              <Sparkles
                className={`w-3.5 h-3.5 ${is420 ? 'text-emerald-400' : 'text-amber-400'}`}
              />
              <span>{is420 ? 'Record Your Vibes & Chill Thoughts' : 'Capture Your Wishes & Intentions'}</span>
            </div>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              A private space to record reflections, gratitude, and feelings alongside your time synchronizations.
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2.5 pt-1 relative z-10">
        <button
          id="btn-open-mindfulness-journal"
          onClick={onOpenJournal}
          className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-98 cursor-pointer text-neutral-950 ${
            is420
              ? 'bg-emerald-400 hover:bg-emerald-300 shadow-emerald-400/20'
              : 'bg-amber-400 hover:bg-amber-300 shadow-amber-400/20'
          }`}
        >
          <BookOpen className="w-4 h-4 text-neutral-950" />
          <span>Open Mindfulness Journal</span>
          <ChevronRight className="w-4 h-4 text-neutral-950" />
        </button>
      </div>
    </div>
  );
};

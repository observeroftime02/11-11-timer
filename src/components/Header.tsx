import React from 'react';
import { Bell, Sparkles, Clock, Globe, Settings } from 'lucide-react';
import { NotificationPreferences, TrackerMode } from '../types';

interface HeaderProps {
  userTimeZone: string;
  onSelectTimeZone?: (tz: string) => void;
  notificationPrefs: NotificationPreferences;
  onOpenNotifications: () => void;
  onOpenWishModal: () => void;
  onOpenWorldDirectory: () => void;
  isWishActiveNow: boolean;
  activeCount: number;
  mode?: TrackerMode;
  currentMode?: TrackerMode;
  onSelectMode: (mode: TrackerMode) => void;
}

export const Header: React.FC<HeaderProps> = ({
  userTimeZone,
  notificationPrefs,
  onOpenNotifications,
  onOpenWishModal,
  onOpenWorldDirectory,
  isWishActiveNow,
  activeCount,
  mode,
  currentMode,
  onSelectMode,
}) => {
  const activeMode = mode || currentMode || '1111';
  const is420 = activeMode === '420';

  return (
    <header className="sticky top-0 z-30 backdrop-blur-md bg-neutral-950/85 border-b border-neutral-800/80 px-3 sm:px-4 lg:px-8 py-2.5 sm:py-3 transition-colors w-full overflow-hidden">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Brand & Home City */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink">
          <div
            className={`relative flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl font-display font-black text-[10px] sm:text-xs shadow-lg shrink-0 transition-all ${
              is420
                ? 'bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 text-neutral-950 shadow-emerald-500/20'
                : 'bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-neutral-950 shadow-amber-500/20'
            }`}
          >
            <span>{is420 ? '4:20' : '11:11'}</span>
            {isWishActiveNow && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 border-2 border-neutral-950 rounded-full animate-ping" />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="font-display font-bold text-sm sm:text-base md:text-lg tracking-tight text-neutral-100 truncate">
                {is420 ? 'Next 4:20' : 'Next 11:11'}
              </h1>
              <span
                className={`hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                  is420
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                }`}
              >
                {is420 ? '🌿 Vibe Tracker' : '✨ Wish Tracker'}
              </span>
            </div>
            <div className="hidden xs:flex items-center gap-1 text-[11px] text-neutral-400 truncate">
              <Clock className="w-3 h-3 text-neutral-500 shrink-0" />
              <span className="truncate">
                <strong className="text-neutral-300 font-medium">
                  {userTimeZone.split('/').pop()?.replace('_', ' ')}
                </strong>
              </span>
            </div>
          </div>
        </div>

        {/* Center: Mode Tabs Toggle (11:11 vs 4:20) */}
        {notificationPrefs.enable420 && (
          <div className="flex items-center bg-neutral-900/90 p-0.5 sm:p-1 rounded-xl sm:rounded-2xl border border-neutral-800 shadow-inner shrink-0">
            <button
              id="tab-mode-1111"
              onClick={() => onSelectMode('1111')}
              className={`flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer ${
                !is420
                  ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-neutral-950 shadow-md shadow-amber-500/20'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <span>✨</span>
              <span>11:11</span>
            </button>
            <button
              id="tab-mode-420"
              onClick={() => onSelectMode('420')}
              className={`flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer ${
                is420
                  ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-neutral-950 shadow-md shadow-emerald-500/20'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <span>🌿</span>
              <span>4:20</span>
            </button>
          </div>
        )}

        {/* Right: Quick Actions */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Show World Directory Button */}
          <button
            id="btn-header-show-world"
            onClick={onOpenWorldDirectory}
            className="flex items-center justify-center gap-1 sm:gap-1.5 p-1.5 sm:px-3 sm:py-2 rounded-xl text-xs font-semibold bg-neutral-900 hover:bg-neutral-850 text-neutral-200 border border-neutral-800 hover:border-neutral-700 transition-all cursor-pointer shadow-sm hover:text-white"
            title="Open all cities directory with live clocks and time zones"
            aria-label="Show world cities directory"
          >
            <Globe
              className={`w-4 h-4 shrink-0 ${is420 ? 'text-emerald-400' : 'text-amber-400'}`}
            />
            <span className="hidden md:inline">Show World</span>
          </button>

          {/* Action / Wish / Vibe Button */}
          <button
            id="btn-header-wish"
            onClick={onOpenWishModal}
            className={`flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer shrink-0 ${
              isWishActiveNow
                ? is420
                  ? 'bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 text-neutral-950 animate-bounce shadow-emerald-400/30'
                  : 'bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 text-neutral-950 animate-bounce shadow-amber-400/30'
                : is420
                ? 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40'
                : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40'
            }`}
            title={is420 ? 'Catch the 4:20 vibe' : 'Make a wish at 11:11'}
          >
            <Sparkles className={`w-3.5 h-3.5 shrink-0 ${isWishActiveNow ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{is420 ? '4:20 Vibe' : 'Make a Wish'}</span>
            <span className="sm:hidden text-[11px]">{is420 ? '4:20' : 'Wish'}</span>
            {activeCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-neutral-950 text-emerald-400 text-[10px] font-bold">
                {activeCount}
              </span>
            )}
          </button>

          {/* Settings & Notifications Modal Button */}
          <button
            id="btn-header-notifications"
            onClick={onOpenNotifications}
            className={`group relative flex items-center justify-center gap-1.5 p-1.5 sm:px-3 sm:py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer shrink-0 ${
              notificationPrefs.enabled
                ? is420
                  ? 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border-emerald-500/40 shadow-sm'
                  : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/40 shadow-sm'
                : 'bg-neutral-900 hover:bg-neutral-850 text-neutral-300 border-neutral-800 hover:text-white hover:border-neutral-700'
            }`}
            title="Settings & Alerts (4:20 mode toggle, audio chimes, notifications)"
            aria-label="Settings and notifications"
          >
            <div className="relative flex items-center justify-center">
              <Settings className="w-4 h-4 transition-transform duration-300 group-hover:rotate-45" />
              {notificationPrefs.enabled && (
                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      is420 ? 'bg-emerald-400' : 'bg-amber-400'
                    }`}
                  />
                  <span
                    className={`relative inline-flex rounded-full h-2 w-2 ${
                      is420 ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                  />
                </span>
              )}
            </div>
            <span className="hidden md:inline">Settings</span>
          </button>
        </div>
      </div>
    </header>
  );
};


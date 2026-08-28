import React from 'react';
import { Bell, BellOff, Sparkles, Clock, Globe } from 'lucide-react';
import { NotificationPreferences } from '../types';

interface HeaderProps {
  userTimeZone: string;
  onSelectTimeZone: (tz: string) => void;
  notificationPrefs: NotificationPreferences;
  onOpenNotifications: () => void;
  onOpenWishModal: () => void;
  onOpenWorldDirectory: () => void;
  isWishActiveNow: boolean;
  activeCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  userTimeZone,
  notificationPrefs,
  onOpenNotifications,
  onOpenWishModal,
  onOpenWorldDirectory,
  isWishActiveNow,
  activeCount,
}) => {
  return (
    <header className="sticky top-0 z-30 backdrop-blur-md bg-neutral-950/80 border-b border-neutral-800/80 px-4 lg:px-8 py-3.5 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-neutral-950 font-display font-black text-xs shadow-lg shadow-amber-500/20">
            <span>11:11</span>
            {isWishActiveNow && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 border-2 border-neutral-950 rounded-full animate-ping" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-bold text-base md:text-lg tracking-tight text-neutral-100 flex items-center gap-1.5">
                Next 11:11
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  World Tracker
                </span>
              </h1>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-neutral-400">
              <Clock className="w-3.5 h-3.5 text-neutral-500" />
              <span>Local zone: <strong className="text-neutral-300 font-medium">{userTimeZone.replace('_', ' ')}</strong></span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          {/* Show World Directory Button */}
          <button
            id="btn-header-show-world"
            onClick={onOpenWorldDirectory}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-neutral-900 hover:bg-neutral-850 text-neutral-200 border border-neutral-800 hover:border-neutral-700 transition-all cursor-pointer shadow-sm hover:text-white"
            title="Open all cities directory with live clocks and time zones"
          >
            <Globe className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden xs:inline">Show World</span>
            <span className="xs:hidden">World</span>
          </button>

          {/* Wish Button */}
          <button
            id="btn-header-wish"
            onClick={onOpenWishModal}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer ${
              isWishActiveNow
                ? 'bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 text-neutral-950 animate-bounce shadow-amber-400/30'
                : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40'
            }`}
            title="Make a wish at 11:11"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isWishActiveNow ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Make a Wish</span>
            <span className="sm:hidden">Wish</span>
            {activeCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-neutral-950 text-amber-400 text-[10px] font-bold">
                {activeCount}
              </span>
            )}
          </button>

          {/* Notifications Toggle */}
          <button
            id="btn-header-notifications"
            onClick={onOpenNotifications}
            className={`p-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
              notificationPrefs.enabled
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                : 'bg-neutral-850 hover:bg-neutral-800 text-neutral-400 border-neutral-800 hover:text-neutral-200'
            }`}
            title={notificationPrefs.enabled ? 'Push notifications active' : 'Configure push notifications'}
          >
            {notificationPrefs.enabled ? (
              <Bell className="w-4 h-4 text-amber-400" />
            ) : (
              <BellOff className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

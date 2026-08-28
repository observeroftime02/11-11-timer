import React from 'react';
import { MapPin, Clock, ArrowUpRight, Compass } from 'lucide-react';
import { Next1111Event } from '../types';
import { formatCountdown, formatCurrentTzTime } from '../utils/timeEngine';

interface UserLocalCardProps {
  userLocalNext: Next1111Event;
  userTimeZone: string;
  onSelectTimeZone: (tz: string) => void;
}

export const UserLocalCard: React.FC<UserLocalCardProps> = ({
  userLocalNext,
  userTimeZone,
  onSelectTimeZone,
}) => {
  const { hours, minutes, seconds } = formatCountdown(userLocalNext.remainingMs);
  const currentLocalTime = formatCurrentTzTime(new Date(), userTimeZone);

  const isVancouver = userTimeZone === 'America/Vancouver';

  return (
    <div className="rounded-3xl bg-neutral-900/80 border border-neutral-800 p-5 md:p-6 backdrop-blur-sm shadow-xl flex flex-col justify-between space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold">
            🇨🇦
          </div>
          <div>
            <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-1">
              <span>Your Local Home Zone</span>
              {isVancouver && <span className="text-emerald-400 font-bold">• Active</span>}
            </div>
            <h3 className="font-display font-bold text-base md:text-lg text-white">
              Vancouver, Canada
            </h3>
          </div>
        </div>

        <span className="font-mono text-xs text-neutral-400 bg-neutral-800/80 px-2.5 py-1 rounded-lg border border-neutral-700">
          {userTimeZone}
        </span>
      </div>

      {/* Clock & Next 11:11 in Vancouver */}
      <div className="grid grid-cols-2 gap-3 py-1">
        <div className="rounded-2xl bg-neutral-950/60 p-3.5 border border-neutral-800/80">
          <div className="text-[11px] text-neutral-400 flex items-center gap-1">
            <Clock className="w-3 h-3 text-neutral-400" />
            <span>Current Clock</span>
          </div>
          <div className="font-mono font-bold text-lg md:text-xl text-neutral-100 mt-1">
            {currentLocalTime}
          </div>
          <div className="text-[10px] text-neutral-500 mt-0.5">Local live time</div>
        </div>

        <div className="rounded-2xl bg-neutral-950/60 p-3.5 border border-neutral-800/80">
          <div className="text-[11px] text-neutral-400 flex items-center gap-1">
            <Compass className="w-3 h-3 text-amber-400" />
            <span>Next Vancouver 11:11</span>
          </div>
          <div className="font-mono font-bold text-lg md:text-xl text-amber-300 mt-1">
            11:11 {userLocalNext.period}
          </div>
          <div className="text-[10px] text-neutral-400 mt-0.5 font-medium">
            in {hours}h {minutes}m {seconds}s
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-xs text-neutral-400 pt-2 border-t border-neutral-800/80 flex items-center justify-between flex-wrap gap-2">
        <span>
          Hits at <strong className="text-neutral-200">{userLocalNext.userTimeFormatted}</strong>
        </span>
        <span className="text-[11px] text-neutral-500">
          {userLocalNext.period === 'AM' ? '☀️ Morning Wish' : '🌙 Night Wish'}
        </span>
      </div>
    </div>
  );
};

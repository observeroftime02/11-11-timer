import React, { useState } from 'react';
import { Smartphone, Sparkles, Copy, Check, Terminal, Clock, RefreshCw, X } from 'lucide-react';
import { Next1111Event, TrackerMode } from '../types';
import { formatCountdown } from '../utils/timeEngine';

interface AndroidWidgetShowcaseProps {
  nextEvent: Next1111Event;
  upcomingList: Next1111Event[];
  userTimeZone: string;
  onClose?: () => void;
  isStandalone?: boolean;
  activeMode?: TrackerMode;
}

export const AndroidWidgetShowcase: React.FC<AndroidWidgetShowcaseProps> = ({
  nextEvent,
  userTimeZone,
  onClose,
  isStandalone = false,
  activeMode = '1111',
}) => {
  const [selectedWidget, setSelectedWidget] = useState<'compact' | 'medium' | 'square'>('medium');
  const [mode, setMode] = useState<TrackerMode>(activeMode);
  const [copiedCmd, setCopiedCmd] = useState(false);

  const is420 = mode === '420';
  const targetLabel = is420 ? '4:20' : '11:11';
  const { hours, minutes, seconds } = formatCountdown(nextEvent.remainingMs);

  const buildCommand = `npm run build:apk`;

  const handleCopy = () => {
    navigator.clipboard.writeText(buildCommand);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  const content = (
    <div className="space-y-6 text-neutral-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-semibold mb-1">
            <Smartphone className="w-3.5 h-3.5" />
            <span>Android Home Screen Widgets</span>
          </div>
          <h3 className="font-display font-bold text-xl text-neutral-100">
            Native Android Widgets (6 Choices)
          </h3>
          <p className="text-xs text-neutral-400 mt-0.5">
            Real-time minute-by-minute updates via AlarmManager for both 11:11 and 4:20.
          </p>
        </div>

        {/* Mode Selector (11:11 vs 4:20) */}
        <div className="flex items-center p-1 bg-neutral-900 rounded-xl border border-neutral-800 shrink-0">
          <button
            onClick={() => setMode('1111')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              !is420
                ? 'bg-amber-500 text-neutral-950 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>11:11 Gold</span>
          </button>
          <button
            onClick={() => setMode('420')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              is420
                ? 'bg-emerald-500 text-neutral-950 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <span>🌿 4:20 Chill</span>
          </button>
        </div>
      </div>

      {/* Widget Choice Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={() => setSelectedWidget('compact')}
          className={`p-3.5 rounded-2xl border transition-all text-left flex items-center justify-between cursor-pointer ${
            selectedWidget === 'compact'
              ? is420
                ? 'bg-neutral-850 border-emerald-500 shadow-md shadow-emerald-500/10'
                : 'bg-neutral-850 border-amber-500 shadow-md shadow-amber-500/10'
              : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700'
          }`}
        >
          <div>
            <div className="font-bold text-sm text-white">Compact Bar</div>
            <div className="text-[11px] text-neutral-400">1 Row • 2×1 or 4×1</div>
          </div>
          <span
            className={`text-xs px-2 py-0.5 rounded-md bg-neutral-800 font-mono ${
              is420 ? 'text-emerald-300' : 'text-amber-300'
            }`}
          >
            2×1
          </span>
        </button>

        <button
          onClick={() => setSelectedWidget('medium')}
          className={`p-3.5 rounded-2xl border transition-all text-left flex items-center justify-between cursor-pointer ${
            selectedWidget === 'medium'
              ? is420
                ? 'bg-neutral-850 border-emerald-500 shadow-md shadow-emerald-500/10'
                : 'bg-neutral-850 border-amber-500 shadow-md shadow-amber-500/10'
              : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700'
          }`}
        >
          <div>
            <div className="font-bold text-sm text-white">Dashboard Card</div>
            <div className="text-[11px] text-neutral-400">Rich Card • 4×2 or 3×2</div>
          </div>
          <span
            className={`text-xs px-2 py-0.5 rounded-md bg-neutral-800 font-mono ${
              is420 ? 'text-emerald-300' : 'text-amber-300'
            }`}
          >
            4×2
          </span>
        </button>

        <button
          onClick={() => setSelectedWidget('square')}
          className={`p-3.5 rounded-2xl border transition-all text-left flex items-center justify-between cursor-pointer ${
            selectedWidget === 'square'
              ? is420
                ? 'bg-neutral-850 border-emerald-500 shadow-md shadow-emerald-500/10'
                : 'bg-neutral-850 border-amber-500 shadow-md shadow-amber-500/10'
              : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700'
          }`}
        >
          <div>
            <div className="font-bold text-sm text-white">Hero Dial</div>
            <div className="text-[11px] text-neutral-400">Square Dial • 2×2 or 3×3</div>
          </div>
          <span
            className={`text-xs px-2 py-0.5 rounded-md bg-neutral-800 font-mono ${
              is420 ? 'text-emerald-300' : 'text-amber-300'
            }`}
          >
            2×2
          </span>
        </button>
      </div>

      {/* Live Device Simulator */}
      <div className="flex flex-col items-center justify-center p-4 sm:p-6 bg-neutral-950 rounded-3xl border border-neutral-800">
        <div className="w-full max-w-sm rounded-[38px] p-3.5 bg-neutral-900 border-[4px] border-neutral-800 shadow-2xl relative">
          {/* Status Bar */}
          <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400 px-3 pt-1 pb-3">
            <span className="font-semibold text-neutral-300">16:14</span>
            <div className="flex items-center gap-1.5">
              <RefreshCw className="w-3 h-3 text-emerald-400 animate-spin" style={{ animationDuration: '4s' }} />
              <span className="text-[9px] text-emerald-400 font-semibold">1m sync</span>
              <span>5G</span>
              <span>📶 85%</span>
            </div>
          </div>

          {/* Wallpaper Area */}
          <div className="rounded-[24px] bg-gradient-to-b from-stone-900 via-neutral-900 to-stone-950 p-3 min-h-[300px] flex flex-col justify-center border border-neutral-800/60 shadow-inner">
            {/* 11:11 Compact Bar */}
            {selectedWidget === 'compact' && !is420 && (
              <div className="rounded-[24px] bg-[#1A1A1E] border border-[#2E2E36] p-3 flex items-center justify-between gap-3 shadow-xl">
                <div className="px-2 py-1 rounded-[8px] bg-amber-500 text-neutral-950 text-xs font-black shrink-0">
                  11:11
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-sm text-white truncate">{nextEvent.city.name}</div>
                  <div className="text-[10px] text-neutral-400 truncate">11:11 {nextEvent.period} • Next worldwide</div>
                </div>
                <div className="px-2.5 py-1 rounded-full bg-[#2E2310] border border-[#593E10] text-[#FBBF24] text-xs font-bold shrink-0">
                  in {minutes}m {seconds}s
                </div>
              </div>
            )}

            {/* 4:20 Compact Bar */}
            {selectedWidget === 'compact' && is420 && (
              <div className="rounded-[24px] bg-[#1A1A1E] border border-[#2E2E36] p-3 flex items-center justify-between gap-3 shadow-xl">
                <div className="px-2 py-1 rounded-[8px] bg-emerald-500 text-neutral-950 text-xs font-black shrink-0">
                  4:20
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-sm text-white truncate">{nextEvent.city.name}</div>
                  <div className="text-[10px] text-neutral-400 truncate">4:20 {nextEvent.period} • Next worldwide</div>
                </div>
                <div className="px-2.5 py-1 rounded-full bg-[#0F2B1D] border border-[#059669] text-[#34D399] text-xs font-bold shrink-0">
                  in {minutes}m {seconds}s
                </div>
              </div>
            )}

            {/* 11:11 Dashboard Card */}
            {selectedWidget === 'medium' && !is420 && (
              <div className="rounded-[28px] bg-[#1A1A1E] border border-[#2E2E36] p-4 space-y-2.5 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-[7px] bg-amber-500 text-neutral-950 text-[10px] font-black">
                      11:11
                    </span>
                    <span className="text-[11px] font-bold text-amber-500 tracking-wider">
                      NEXT CITY IN THE WORLD
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-[#2E2310] border border-[#593E10] text-[#FBBF24] text-[10px] font-bold">
                    in {minutes} min
                  </span>
                </div>

                <div>
                  <div className="font-bold text-lg text-white leading-tight">
                    {nextEvent.city.name}
                  </div>
                  <div className="text-xs text-neutral-400 mt-0.5">
                    11:11 {nextEvent.period} • {nextEvent.city.baseOffsetUtc}
                  </div>
                </div>

                <div className="rounded-xl bg-[#26262E] px-3 py-1.5 flex items-center justify-between text-xs">
                  <span className="text-amber-200 font-bold font-mono">
                    ⏳ Exact: in {hours > '00' ? `${hours}h ` : ''}{minutes}m {seconds}s
                  </span>
                  <span className="text-[10px] text-neutral-400">Tap to open →</span>
                </div>
              </div>
            )}

            {/* 4:20 Dashboard Card */}
            {selectedWidget === 'medium' && is420 && (
              <div className="rounded-[28px] bg-[#1A1A1E] border border-[#2E2E36] p-4 space-y-2.5 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-[7px] bg-emerald-500 text-neutral-950 text-[10px] font-black">
                      4:20
                    </span>
                    <span className="text-[11px] font-bold text-emerald-400 tracking-wider">
                      NEXT 4:20 IN THE WORLD
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-[#0F2B1D] border border-[#059669] text-[#34D399] text-[10px] font-bold">
                    in {minutes} min
                  </span>
                </div>

                <div>
                  <div className="font-bold text-lg text-white leading-tight">
                    {nextEvent.city.name}
                  </div>
                  <div className="text-xs text-neutral-400 mt-0.5">
                    4:20 {nextEvent.period} • {nextEvent.city.baseOffsetUtc}
                  </div>
                </div>

                <div className="rounded-xl bg-[#26262E] px-3 py-1.5 flex items-center justify-between text-xs">
                  <span className="text-emerald-200 font-bold font-mono">
                    ⏳ Exact: in {hours > '00' ? `${hours}h ` : ''}{minutes}m {seconds}s
                  </span>
                  <span className="text-[10px] text-neutral-400">Tap to open →</span>
                </div>
              </div>
            )}

            {/* 11:11 Square Dial */}
            {selectedWidget === 'square' && !is420 && (
              <div className="w-48 h-48 mx-auto rounded-[28px] bg-[#1A1A1E] border border-[#2E2E36] p-4 flex flex-col items-center justify-center text-center shadow-xl">
                <div className="text-[10px] font-bold text-amber-500 tracking-wider uppercase">
                  Next 11:11
                </div>
                <div className="font-black text-3xl text-amber-400 tracking-tight my-0.5">
                  11:11
                </div>
                <div className="px-2.5 py-0.5 rounded-full bg-[#2E2310] border border-[#593E10] text-[#FDE68A] text-xs font-bold mb-2">
                  in {minutes}m {seconds}s
                </div>
                <div className="font-bold text-xs text-white truncate max-w-full">
                  {nextEvent.city.name}
                </div>
                <div className="text-[10px] text-neutral-400">11:11 {nextEvent.period}</div>
              </div>
            )}

            {/* 4:20 Square Dial */}
            {selectedWidget === 'square' && is420 && (
              <div className="w-48 h-48 mx-auto rounded-[28px] bg-[#1A1A1E] border border-[#2E2E36] p-4 flex flex-col items-center justify-center text-center shadow-xl">
                <div className="text-[10px] font-bold text-emerald-400 tracking-wider uppercase">
                  Next 4:20
                </div>
                <div className="font-black text-3xl text-emerald-400 tracking-tight my-0.5">
                  4:20
                </div>
                <div className="px-2.5 py-0.5 rounded-full bg-[#0F2B1D] border border-[#059669] text-[#A7F3D0] text-xs font-bold mb-2">
                  in {minutes}m {seconds}s
                </div>
                <div className="font-bold text-xs text-white truncate max-w-full">
                  {nextEvent.city.name}
                </div>
                <div className="text-[10px] text-neutral-400">4:20 {nextEvent.period}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Automatic Minute Updates Explanation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="p-3.5 rounded-2xl bg-neutral-900/90 border border-neutral-800 space-y-1.5">
          <div className="flex items-center gap-2 font-bold text-neutral-200">
            <RefreshCw className="w-4 h-4 text-emerald-400" />
            <span>Minute-by-Minute Updates</span>
          </div>
          <p className="text-neutral-400 text-[11px] leading-relaxed">
            Widgets schedule precise <code className="text-emerald-300">AlarmManager</code> ticks aligned to every 00-second mark, bypassing Android's 30-minute system limit.
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-neutral-900/90 border border-neutral-800 space-y-1.5">
          <div className="flex items-center gap-2 font-bold text-neutral-200">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Instant System Time Sync</span>
          </div>
          <p className="text-neutral-400 text-[11px] leading-relaxed">
            Broadcast receivers automatically catch time changes, timezone transitions, and device boot to keep your home screen 100% accurate.
          </p>
        </div>
      </div>

      {/* 1-Command Build Workflow */}
      <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span>100% Automated Build (No Manual Copying)</span>
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-xs font-semibold text-neutral-200 border border-neutral-700 transition-colors cursor-pointer"
          >
            {copiedCmd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedCmd ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        <p className="text-xs text-neutral-400">
          Run this single command to build the Android APK with all 6 widgets & alarm managers:
        </p>

        <pre className="bg-neutral-950 p-3 rounded-xl text-xs font-mono text-amber-300 border border-neutral-800 overflow-x-auto">
{`npm run build:apk
cd android && ./gradlew assembleDebug`}
        </pre>
      </div>
    </div>
  );

  if (isStandalone) {
    return content;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl rounded-3xl bg-neutral-900 border border-neutral-800 p-6 md:p-8 shadow-2xl space-y-5 overflow-hidden max-h-[90vh] overflow-y-auto">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors cursor-pointer z-10"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        {content}
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { X, Bell, Volume2, Check, Sparkles, Sliders } from 'lucide-react';
import { NotificationPreferences, CityTimeZone, TrackerMode, UserWish } from '../types';
import {
  requestNotificationPermission,
  getNotificationPermissionStatus,
  playChimeSound,
  synthesizeChillTone,
  send1111Notification,
} from '../utils/notifications';
import { getNextTargetForCity } from '../utils/timeEngine';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefs: NotificationPreferences;
  onUpdatePrefs: (newPrefs: NotificationPreferences) => void;
  currentNextCity: CityTimeZone;
  activeMode?: TrackerMode;
  wishes?: UserWish[];
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  prefs,
  onUpdatePrefs,
  currentNextCity,
  activeMode = '1111',
  wishes = [],
}) => {
  const [permState, setPermState] = useState<'granted' | 'denied' | 'prompt' | 'unsupported'>('prompt');
  const [testSent, setTestSent] = useState(false);

  useEffect(() => {
    if (isOpen) {
      getNotificationPermissionStatus().then(setPermState);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleEnableToggle = async () => {
    const nextState = !prefs.enabled;
    onUpdatePrefs({ ...prefs, enabled: nextState });

    if (nextState) {
      const granted = await requestNotificationPermission();
      const newPerm = await getNotificationPermissionStatus();
      setPermState(newPerm);

      if (prefs.soundEnabled) {
        if (activeMode === '420') {
          synthesizeChillTone();
        } else {
          playChimeSound();
        }
      }
    }
  };

  const handleTestNotification = async () => {
    const modeToUse: TrackerMode = activeMode === '420' ? '420' : '1111';
    const nextEv = getNextTargetForCity(currentNextCity, modeToUse, new Date());
    await send1111Notification(currentNextCity, nextEv.period, nextEv.localTimeFormatted, modeToUse, {
      playSound: prefs.soundEnabled,
      isTest: true,
      dedupeKey: `test-${modeToUse}-${Date.now()}`,
    }, wishes);
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg rounded-3xl bg-neutral-900 border border-neutral-800 p-6 md:p-8 shadow-2xl space-y-5 overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display font-bold text-xl text-white">
              Settings & Notifications
            </h3>
            <p className="text-xs text-neutral-400">
              Customize your target moments (11:11 & 4:20), tab navigation, and alerts.
            </p>
          </div>
        </div>

        {/* Mode Feature Toggle: 4:20 Tab & Mode */}
        <div className="rounded-2xl bg-neutral-950 p-4 border border-neutral-800 space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="font-semibold text-sm text-neutral-100 flex items-center gap-2">
                <span>🌿 Show 4:20 Mode Tab in Navigation</span>
                {prefs.enable420 ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                    Tab Visible
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 text-[10px] font-medium border border-neutral-700">
                    Tab Hidden
                  </span>
                )}
              </div>
              <div className="text-xs text-neutral-400 mt-0.5">
                Displays the 4:20 mode tab in the top header. You can configure 4:20 alerts independently below.
              </div>
            </div>

            <button
              id="toggle-enable-420-mode"
              onClick={() => onUpdatePrefs({ ...prefs, enable420: !prefs.enable420 })}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors cursor-pointer shrink-0 ${
                prefs.enable420 ? 'bg-emerald-500' : 'bg-neutral-800'
              }`}
              aria-label="Toggle 4:20 tab display"
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-neutral-950 shadow-md transition-transform ${
                  prefs.enable420 ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Master Push Alert Toggle */}
        <div className="rounded-2xl bg-neutral-950 p-4 border border-neutral-800 flex items-center justify-between gap-4">
          <div>
            <div className="font-semibold text-sm text-neutral-100 flex items-center gap-2">
              <span>Enable Background Push Alerts</span>
              {prefs.enabled && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                  <Check className="w-3 h-3" />
                  Active
                </span>
              )}
            </div>
            <div className="text-xs text-neutral-400 mt-0.5">
              1 consolidated notification per time moment (AM & PM)
            </div>
          </div>

          <button
            id="toggle-master-notifications"
            onClick={handleEnableToggle}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors cursor-pointer shrink-0 ${
              prefs.enabled ? 'bg-amber-500' : 'bg-neutral-800'
            }`}
            aria-label="Toggle background push alerts"
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-neutral-950 shadow-md transition-transform ${
                prefs.enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Notification Event Channels (11:11 and/or 4:20) */}
        {prefs.enabled && (
          <div className="rounded-2xl bg-neutral-950 p-4 border border-neutral-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-neutral-300">Notification Alert Channels</div>
              <div className="text-[11px] text-neutral-500">Choose which moments send notifications</div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <label
                className={`p-2.5 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all ${
                  prefs.notify1111 !== false
                    ? 'bg-amber-500/10 border-amber-500/50 text-white font-medium'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-400'
                }`}
              >
                <input
                  type="checkbox"
                  checked={prefs.notify1111 !== false}
                  onChange={(e) => onUpdatePrefs({ ...prefs, notify1111: e.target.checked })}
                  className="accent-amber-500 rounded"
                />
                <span>✨ 11:11 Alerts</span>
              </label>

              <label
                className={`p-2.5 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all ${
                  prefs.notify420 !== false
                    ? 'bg-emerald-500/10 border-emerald-500/50 text-white font-medium'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-400'
                }`}
              >
                <input
                  type="checkbox"
                  checked={prefs.notify420 !== false}
                  onChange={(e) => onUpdatePrefs({ ...prefs, notify420: e.target.checked })}
                  className="accent-emerald-500 rounded"
                />
                <span>🌿 4:20 Alerts</span>
              </label>
            </div>
          </div>
        )}

        {/* Notification Scope */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-neutral-400 block">
            Notification Delivery Scope
          </label>
          <div className="grid grid-cols-1 gap-2 text-xs">
            {[
              {
                id: 'worldwide',
                title: 'Worldwide Sweep (1 per time slot)',
                desc: 'Alerts as the moment sweeps across Earth; simultaneous cities are grouped into 1 notification',
              },
              {
                id: 'local_only',
                title: 'Home City Only',
                desc: 'Only alerts twice daily for AM & PM in your selected home city',
              },
              {
                id: 'favorites',
                title: 'Starred Favorite Cities Only',
                desc: 'Only notify for cities you have marked with a star',
              },
            ].map((opt) => (
              <label
                key={opt.id}
                onClick={() => onUpdatePrefs({ ...prefs, scope: opt.id as any })}
                className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                  prefs.scope === opt.id
                    ? 'bg-amber-500/10 border-amber-500/50 text-white'
                    : 'bg-neutral-950 border-neutral-850 text-neutral-400 hover:border-neutral-750'
                }`}
              >
                <input
                  type="radio"
                  name="scope"
                  checked={prefs.scope === opt.id}
                  onChange={() => {}}
                  className="mt-0.5 accent-amber-500"
                />
                <div>
                  <div className="font-semibold text-neutral-200">{opt.title}</div>
                  <div className="text-[11px] text-neutral-400 mt-0.5">{opt.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Sound Toggle */}
        <div className="rounded-2xl bg-neutral-950 p-4 border border-neutral-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Volume2 className="w-4 h-4 text-amber-400" />
            <div>
              <div className="font-semibold text-xs sm:text-sm text-neutral-100">
                Harmonic Arrival Audio
              </div>
              <div className="text-[11px] text-neutral-400">
                528Hz crystal chime for 11:11 / 216Hz mellow tone for 4:20
              </div>
            </div>
          </div>

          <button
            onClick={() => onUpdatePrefs({ ...prefs, soundEnabled: !prefs.soundEnabled })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer shrink-0 ${
              prefs.soundEnabled ? 'bg-amber-500' : 'bg-neutral-800'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-neutral-950 shadow-md transition-transform ${
                prefs.soundEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            id="btn-test-notification"
            onClick={handleTestNotification}
            className="flex-1 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-200 text-xs font-semibold border border-neutral-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Test {activeMode === '420' ? '4:20' : '11:11'} Push & Sound</span>
          </button>

          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            Done
          </button>
        </div>

        {testSent && (
          <div className="text-center text-xs text-emerald-400 font-semibold animate-fade-in flex items-center justify-center gap-1.5">
            <Check className="w-3.5 h-3.5" />
            <span>
              Test {activeMode === '420' ? '4:20' : '11:11'} alert dispatched & audio tone played!
            </span>
          </div>
        )}
      </div>
    </div>
  );
};


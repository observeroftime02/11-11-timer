import React, { useState, useEffect } from 'react';
import { X, Bell, Volume2, ShieldCheck, Check, AlertCircle, Sparkles, Smartphone } from 'lucide-react';
import { NotificationPreferences, CityTimeZone } from '../types';
import {
  requestNotificationPermission,
  getNotificationPermissionStatus,
  playChimeSound,
  send1111Notification,
} from '../utils/notifications';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefs: NotificationPreferences;
  onUpdatePrefs: (newPrefs: NotificationPreferences) => void;
  currentNextCity: CityTimeZone;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  prefs,
  onUpdatePrefs,
  currentNextCity,
}) => {
  const [permState, setPermState] = useState<'granted' | 'denied' | 'prompt' | 'unsupported'>('prompt');
  const [testSent, setTestSent] = useState(false);
  const isNative = typeof window !== 'undefined' && (window as any)?.Capacitor?.isNativePlatform?.();

  useEffect(() => {
    if (isOpen) {
      getNotificationPermissionStatus().then(setPermState);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleEnableToggle = async () => {
    const nextState = !prefs.enabled;
    // Always update preference immediately so user is never locked out
    onUpdatePrefs({ ...prefs, enabled: nextState });

    if (nextState) {
      const granted = await requestNotificationPermission();
      const newPerm = await getNotificationPermissionStatus();
      setPermState(newPerm);

      // Play soft chime to confirm activation
      if (prefs.soundEnabled) {
        playChimeSound();
      }
    }
  };

  const handleTestNotification = async () => {
    if (prefs.soundEnabled) {
      playChimeSound();
    }
    await send1111Notification(currentNextCity, 'AM', '3:11 PM');
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg rounded-3xl bg-neutral-900 border border-neutral-800 p-6 md:p-8 shadow-2xl space-y-6 overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display font-bold text-xl text-white">
                11:11 Notifications
              </h3>
              {isNative && (
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1">
                  <Smartphone className="w-3 h-3" />
                  Android APK
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-400">
              Receive a gentle alert when 11:11 strikes worldwide or in your city (1 notification per occurrence).
            </p>
          </div>
        </div>

        {/* Master Toggle */}
        <div className="rounded-2xl bg-neutral-950 p-4 border border-neutral-800 flex items-center justify-between gap-4">
          <div>
            <div className="font-semibold text-sm text-neutral-100 flex items-center gap-2">
              <span>Enable 11:11 Alerts</span>
              {prefs.enabled && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                  <Check className="w-3 h-3" />
                  Active
                </span>
              )}
            </div>
            <div className="text-xs text-neutral-400 mt-0.5">
              1 consolidated notification per 11:11 moment (AM & PM)
            </div>
          </div>

          <button
            id="toggle-master-notifications"
            onClick={handleEnableToggle}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors cursor-pointer ${
              prefs.enabled ? 'bg-amber-500' : 'bg-neutral-800'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-neutral-950 shadow-md transition-transform ${
                prefs.enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Notification Scope */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-neutral-400 block">
            Notification Scope
          </label>
          <div className="grid grid-cols-1 gap-2 text-xs">
            {[
              {
                id: 'worldwide',
                title: 'Every 11:11 in the World (1 per time slot)',
                desc: 'Alerts as 11:11 sweeps across Earth; simultaneous cities are grouped into 1 notification',
              },
              {
                id: 'local_only',
                title: 'Vancouver (Home) Only',
                desc: 'Only alerts twice daily for 11:11 AM & 11:11 PM in Vancouver',
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
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
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
                Harmonic Crystal Chime
              </div>
              <div className="text-[11px] text-neutral-400">
                Plays peaceful 528Hz bell chime upon arrival
              </div>
            </div>
          </div>

          <button
            onClick={() => onUpdatePrefs({ ...prefs, soundEnabled: !prefs.soundEnabled })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
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
            <span>Send Test Push & Chime</span>
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
            <span>Test push alert dispatched & harmonic chime played!</span>
          </div>
        )}
      </div>
    </div>
  );
};

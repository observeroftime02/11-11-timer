import React from 'react';
import { X, Shield, Lock, EyeOff, Bell, Smartphone, Database } from 'lucide-react';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      id="privacy-policy-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-2xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/25">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-100 font-display">Privacy Policy</h2>
              <p className="text-xs text-neutral-400">Next 11:11 — Transparent & Offline-First</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto px-6 py-5 text-sm text-neutral-300 space-y-4 leading-relaxed">
          <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/40 flex items-start gap-3">
            <Lock className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-200">
              <strong>Summary:</strong> Next 11:11 does <strong>not</strong> collect, track, sell, or transmit any personal data, accounts, or private wishes. All data remains exclusively on your device.
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5 flex items-center gap-1.5">
              <EyeOff className="w-3.5 h-3.5 text-amber-400" /> 1. No Data Collection
            </h3>
            <p className="text-xs text-neutral-400">
              We do not collect personal identifiers, email addresses, phone numbers, location coordinates, or advertising identifiers. You do not need to register or create an account to use the application.
            </p>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-amber-400" /> 2. Local Device Storage
            </h3>
            <p className="text-xs text-neutral-400">
              Your favorite cities, wish journal entries, and notification settings are saved exclusively on your local device storage (<code className="text-amber-300 font-mono text-[11px]">localStorage</code> / native device storage). We have no access to your journal or wishes.
            </p>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5 flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-amber-400" /> 3. On-Device Notifications & Audio
            </h3>
            <p className="text-xs text-neutral-400">
              Scheduled 11:11 alerts and harmonic chime sounds are generated locally by Android's on-device AlarmManager and NotificationManager. No remote servers or external push messaging services (like Firebase Cloud Messaging) are used to track or deliver alerts.
            </p>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5 flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-amber-400" /> 4. Device Permissions
            </h3>
            <p className="text-xs text-neutral-400">
              • <strong>Post Notifications:</strong> Used solely to alert you when 11:11 arrives in your selected cities.
              <br />
              • <strong>Exact Alarms:</strong> Used solely to ensure precise 11:11 minute accuracy without draining battery.
            </p>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5">5. Contact</h3>
            <p className="text-xs text-neutral-400">
              For any questions regarding this Privacy Policy, please contact the developer via the official Google Play store listing page.
            </p>
          </div>

          <div className="pt-2 text-[11px] text-neutral-500 border-t border-neutral-800">
            Last updated: August 2026
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-neutral-800 bg-neutral-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export type TrackerMode = '1111' | '420';

export interface CityTimeZone {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  flag: string;
  timeZone: string; // IANA identifier, e.g., 'America/Vancouver'
  region: 'Americas' | 'Europe' | 'Asia' | 'Africa' | 'Oceania' | 'Pacific' | 'Antarctica';
  lat: number;
  lng: number;
  landmark?: string;
  baseOffsetUtc: string; // e.g. "UTC-9", "UTC+3"
}

export interface Next1111Event {
  city: CityTimeZone;
  period: 'AM' | 'PM';
  targetDate: Date;
  remainingMs: number;
  localTimeFormatted: string; // e.g. "11:11 AM" or "4:20 PM"
  userTimeFormatted: string; // e.g. "1:11 PM PDT"
  isCurrentActive: boolean; // True if it is currently target time (11:11:xx or 4:20:xx)
  mode: TrackerMode;
}

export type NextMomentEvent = Next1111Event;

export interface Grouped1111Slot {
  id: string;
  targetDate: Date;
  remainingMs: number;
  cities: Next1111Event[];
  cityNames: string[];
  primaryCity: CityTimeZone;
  primaryTz: string;
  gmtOffsetFormatted: string;
  localPeriodFormatted: string; // e.g. "11:11 AM local time" or "4:20 PM local time"
  clockNowFormatted: string;
  utcTargetFormatted: string; // e.g. "at 20:11:00 UTC"
  approxMinutesText: string; // e.g. "≈ 9 minutes from now"
  isCurrentActive: boolean;
  mode: TrackerMode;
}

export type GroupedMomentSlot = Grouped1111Slot;

export interface NotificationPreferences {
  enabled: boolean;
  soundEnabled: boolean;
  scope: 'worldwide' | 'local_only' | 'favorites';
  notifyMinutesBefore: number;
  favoriteCityIds: string[];
  enable420: boolean; // Whether 4:20 mode tab and features are enabled
  notify1111: boolean; // Whether to send 11:11 alerts
  notify420: boolean; // Whether to send 4:20 alerts
}

export interface UserWish {
  id: string;
  wishText: string;
  timestamp: number;
  cityName: string;
  period: 'AM' | 'PM';
  targetTimestamp?: number;
  mode?: TrackerMode;
}

export type WidgetStyle = 'material_you' | 'compact_pill' | 'rich_card' | 'minimal_glance';
export type WidgetTheme = 'amber' | 'indigo' | 'emerald' | 'sunset' | 'midnight';


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
  localTimeFormatted: string; // e.g. "11:11 AM"
  userTimeFormatted: string; // e.g. "1:11 PM PDT"
  isCurrentActive: boolean; // True if it is currently 11:11:xx in that timezone
}

export interface Grouped1111Slot {
  id: string;
  targetDate: Date;
  remainingMs: number;
  cities: Next1111Event[];
  cityNames: string[];
  primaryCity: CityTimeZone;
  primaryTz: string;
  gmtOffsetFormatted: string;
  localPeriodFormatted: string; // e.g. "11:11 AM local time"
  clockNowFormatted: string;
  utcTargetFormatted: string; // e.g. "at 20:11:00 UTC"
  approxMinutesText: string; // e.g. "≈ 9 minutes from now"
  isCurrentActive: boolean;
}

export interface NotificationPreferences {
  enabled: boolean;
  soundEnabled: boolean;
  scope: 'worldwide' | 'local_only' | 'favorites';
  notifyMinutesBefore: number;
  favoriteCityIds: string[];
}

export interface UserWish {
  id: string;
  wishText: string;
  timestamp: number;
  cityName: string;
  period: 'AM' | 'PM';
  targetTimestamp?: number;
}

export type WidgetStyle = 'material_you' | 'compact_pill' | 'rich_card' | 'minimal_glance';
export type WidgetTheme = 'amber' | 'indigo' | 'emerald' | 'sunset' | 'midnight';

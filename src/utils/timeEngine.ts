import { CityTimeZone, Next1111Event, Grouped1111Slot, TrackerMode } from '../types';
import { WORLD_CITIES } from '../data/timezones';

function ensureDate(d: any): Date {
  if (d instanceof Date && !isNaN(d.getTime())) return d;
  if (typeof d === 'string' || typeof d === 'number') {
    const parsed = new Date(d);
    if (!isNaN(parsed.getTime())) return parsed;
  }
  return new Date();
}

/**
 * Target configuration for 11:11 and 4:20 modes
 */
export interface TargetMomentDefinition {
  mode: TrackerMode;
  label: string; // '11:11' or '4:20'
  amHour: number; // 11 or 4
  pmHour: number; // 23 or 16
  targetMinute: number; // 11 or 20
  title: string; // "11:11" or "4:20"
  emoji: string; // "✨" or "🌿"
  colorTheme: 'amber' | 'emerald';
}

export const TARGET_MOMENTS: Record<TrackerMode, TargetMomentDefinition> = {
  '1111': {
    mode: '1111',
    label: '11:11',
    amHour: 11,
    pmHour: 23,
    targetMinute: 11,
    title: '11:11 Wish Time',
    emoji: '✨',
    colorTheme: 'amber',
  },
  '420': {
    mode: '420',
    label: '4:20',
    amHour: 4,
    pmHour: 16,
    targetMinute: 20,
    title: '4:20 Vibe Time',
    emoji: '🌿',
    colorTheme: 'emerald',
  },
};

const formattersCache = new Map<string, Intl.DateTimeFormat>();

export function getCachedFormatter(locale: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const cacheKey = `${locale}-${JSON.stringify(options)}`;
  let formatter = formattersCache.get(cacheKey);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, options);
    formattersCache.set(cacheKey, formatter);
  }
  return formatter;
}

/**
 * Gets the current breakdown (year, month, day, hour, minute, second) in a given IANA timezone.
 */
export function getTzParts(inputDate: Date, timeZone: string): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  millisecond: number;
} {
  const date = ensureDate(inputDate);
  try {
    const formatter = getCachedFormatter('en-US', {
      timeZone: timeZone || 'America/Vancouver',
      hour12: false,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
    });

    const parts = formatter.formatToParts(date);
    const map: Record<string, number> = {};
    for (const p of parts) {
      if (p.type !== 'literal') {
        map[p.type] = parseInt(p.value, 10);
      }
    }

    let hour = map.hour ?? 0;
    if (hour === 24) hour = 0;

    return {
      year: map.year ?? date.getUTCFullYear(),
      month: map.month ?? date.getUTCMonth() + 1,
      day: map.day ?? date.getUTCDate(),
      hour,
      minute: map.minute ?? 0,
      second: map.second ?? 0,
      millisecond: date.getMilliseconds(),
    };
  } catch {
    // Fallback to UTC
    return {
      year: date.getUTCFullYear(),
      month: date.getUTCMonth() + 1,
      day: date.getUTCDate(),
      hour: date.getUTCHours(),
      minute: date.getUTCMinutes(),
      second: date.getUTCSeconds(),
      millisecond: date.getMilliseconds(),
    };
  }
}

/**
 * Finds the exact UTC Date when a timezone hits targetHour:targetMinute:00
 * on a given local calendar date.
 */
export function findUtcForTzLocalTime(
  year: number,
  month: number,
  day: number,
  targetHour: number,
  targetMinute: number,
  timeZone: string
): Date {
  let guess = new Date(Date.UTC(year, month - 1, day, targetHour, targetMinute, 0));
  
  // Refine guess up to 4 times to account for timezone offsets and daylight saving transitions
  for (let i = 0; i < 4; i++) {
    const local = getTzParts(guess, timeZone);
    const localDateUtcRepr = Date.UTC(local.year, local.month - 1, local.day, local.hour, local.minute, local.second);
    const targetDateUtcRepr = Date.UTC(year, month - 1, day, targetHour, targetMinute, 0);
    const diff = targetDateUtcRepr - localDateUtcRepr;
    if (diff === 0) break;
    guess = new Date(guess.getTime() + diff);
  }
  return guess;
}

/**
 * Formats GMT offset e.g. "GMT-09:00" or "GMT+03:00"
 */
export function getGmtOffsetString(date: Date, timeZone: string): string {
  try {
    const formatter = getCachedFormatter('en-US', {
      timeZone,
      timeZoneName: 'longOffset',
    });
    const parts = formatter.formatToParts(date);
    const tzPart = parts.find((p) => p.type === 'timeZoneName');
    if (tzPart && tzPart.value) {
      return tzPart.value;
    }
  } catch {
    // ignore
  }
  return 'GMT';
}

/**
 * Calculates the most recent past target event (either 11:11 or 4:20, AM or PM) for a specific city.
 */
export function getPastTargetForCity(
  city: CityTimeZone,
  mode: TrackerMode = '1111',
  now: Date = new Date(),
  userTimeZone: string = 'America/Vancouver'
): Next1111Event {
  const config = TARGET_MOMENTS[mode] || TARGET_MOMENTS['1111'];
  const local = getTzParts(now, city.timeZone);

  const isAmNow = local.hour === config.amHour && local.minute === config.targetMinute;
  const isPmNow = local.hour === config.pmHour && local.minute === config.targetMinute;
  const isCurrentActive = isAmNow || isPmNow;

  // Potential past local targets:
  const candidates: { hour: number; dayOffset: number; period: 'AM' | 'PM' }[] = [
    { hour: config.pmHour, dayOffset: 0, period: 'PM' },
    { hour: config.amHour, dayOffset: 0, period: 'AM' },
    { hour: config.pmHour, dayOffset: -1, period: 'PM' },
    { hour: config.amHour, dayOffset: -1, period: 'AM' },
    { hour: config.pmHour, dayOffset: -2, period: 'PM' },
  ];

  let lastTargetDate: Date | null = null;
  let lastPeriod: 'AM' | 'PM' = 'AM';
  let minElapsed = Infinity;
  const nowMs = now.getTime();

  for (const cand of candidates) {
    const targetLocalDay = local.day + cand.dayOffset;
    const targetDate = findUtcForTzLocalTime(local.year, local.month, targetLocalDay, cand.hour, config.targetMinute, city.timeZone);
    const elapsed = nowMs - targetDate.getTime();

    if (elapsed >= 0 && elapsed < minElapsed) {
      minElapsed = elapsed;
      lastTargetDate = targetDate;
      lastPeriod = cand.period;
    }
  }

  if (!lastTargetDate) {
    lastTargetDate = findUtcForTzLocalTime(local.year, local.month, local.day - 1, config.pmHour, config.targetMinute, city.timeZone);
    lastPeriod = 'PM';
    minElapsed = Math.max(0, nowMs - lastTargetDate.getTime());
  }

  const userFormatter = getCachedFormatter('en-US', {
    timeZone: userTimeZone,
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZoneName: 'short',
  });

  return {
    city,
    period: lastPeriod,
    targetDate: lastTargetDate,
    remainingMs: -minElapsed,
    localTimeFormatted: `${config.label} ${lastPeriod}`,
    userTimeFormatted: userFormatter.format(lastTargetDate),
    isCurrentActive,
    mode,
  };
}

/**
 * Calculates the next target event (either 11:11 or 4:20, AM or PM) for a specific city.
 */
export function getNextTargetForCity(
  city: CityTimeZone,
  mode: TrackerMode = '1111',
  now: Date = new Date(),
  userTimeZone: string = 'America/Vancouver'
): Next1111Event {
  const config = TARGET_MOMENTS[mode] || TARGET_MOMENTS['1111'];
  const local = getTzParts(now, city.timeZone);
  
  // Is it target time (e.g. 11:11:xx or 4:20:xx) right now?
  const isAmNow = local.hour === config.amHour && local.minute === config.targetMinute;
  const isPmNow = local.hour === config.pmHour && local.minute === config.targetMinute;
  const isCurrentActive = isAmNow || isPmNow;

  // Potential local targets:
  const candidates: { hour: number; dayOffset: number; period: 'AM' | 'PM' }[] = [
    { hour: config.amHour, dayOffset: 0, period: 'AM' },
    { hour: config.pmHour, dayOffset: 0, period: 'PM' },
    { hour: config.amHour, dayOffset: 1, period: 'AM' },
    { hour: config.pmHour, dayOffset: 1, period: 'PM' },
  ];

  let nextTargetDate: Date | null = null;
  let nextPeriod: 'AM' | 'PM' = 'AM';
  let minRemaining = Infinity;
  const nowMs = now.getTime();

  for (const cand of candidates) {
    const targetLocalDay = local.day + cand.dayOffset;
    const targetDate = findUtcForTzLocalTime(local.year, local.month, targetLocalDay, cand.hour, config.targetMinute, city.timeZone);
    const remaining = targetDate.getTime() - nowMs;

    if (remaining > 0 && remaining < minRemaining) {
      minRemaining = remaining;
      nextTargetDate = targetDate;
      nextPeriod = cand.period;
    }
  }

  if (!nextTargetDate) {
    nextTargetDate = findUtcForTzLocalTime(local.year, local.month, local.day + 1, config.amHour, config.targetMinute, city.timeZone);
    nextPeriod = 'AM';
    minRemaining = nextTargetDate.getTime() - nowMs;
  }

  const userFormatter = getCachedFormatter('en-US', {
    timeZone: userTimeZone,
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZoneName: 'short',
  });

  return {
    city,
    period: nextPeriod,
    targetDate: nextTargetDate,
    remainingMs: Math.max(0, minRemaining),
    localTimeFormatted: `${config.label} ${nextPeriod}`,
    userTimeFormatted: userFormatter.format(nextTargetDate),
    isCurrentActive,
    mode,
  };
}

/**
 * Backward-compatible helper for 11:11
 */
export function getNext1111ForCity(
  city: CityTimeZone,
  now: Date = new Date(),
  userTimeZone: string = 'America/Vancouver'
): Next1111Event {
  return getNextTargetForCity(city, '1111', now, userTimeZone);
}

/**
 * Helper for 4:20
 */
export function getNext420ForCity(
  city: CityTimeZone,
  now: Date = new Date(),
  userTimeZone: string = 'America/Vancouver'
): Next1111Event {
  return getNextTargetForCity(city, '420', now, userTimeZone);
}

/**
 * Returns grouped target slots across all cities worldwide for 11:11 or 4:20 mode.
 * Groups cities that hit the target minute at the exact same target UTC second.
 */
export function getNextTargetWorldwide(
  arg1?: TrackerMode | CityTimeZone[],
  arg2?: CityTimeZone[] | TrackerMode | Date | string,
  nowOrTz?: Date | string,
  maybeUserTimeZone?: string
): {
  primarySlot: Grouped1111Slot;
  primary: Next1111Event;
  activeNow: CityTimeZone[];
  groupedUpcoming: Grouped1111Slot[];
  pastSlots: Grouped1111Slot[];
  upcomingTimeline: Next1111Event[];
  userLocalNext: Next1111Event;
  mode: TrackerMode;
  config: TargetMomentDefinition;
} {
  let mode: TrackerMode = '1111';
  let cities: CityTimeZone[] = WORLD_CITIES;
  let dateParam: Date | string | undefined = nowOrTz;
  let tzParam: string | undefined = maybeUserTimeZone;

  if (Array.isArray(arg1)) {
    cities = arg1;
    if (typeof arg2 === 'string' && (arg2 === '1111' || arg2 === '420')) {
      mode = arg2 as TrackerMode;
    } else if (arg2 instanceof Date || typeof arg2 === 'string') {
      dateParam = arg2 as Date | string;
    }
  } else if (typeof arg1 === 'string' && (arg1 === '1111' || arg1 === '420')) {
    mode = arg1 as TrackerMode;
    if (Array.isArray(arg2)) {
      cities = arg2;
    } else if (arg2 instanceof Date || typeof arg2 === 'string') {
      dateParam = arg2 as Date | string;
    }
  }

  let now: Date;
  let userTimeZone: string;

  if (typeof dateParam === 'string' && !tzParam) {
    userTimeZone = dateParam;
    now = new Date();
  } else {
    now = ensureDate(dateParam);
    userTimeZone = tzParam || (typeof dateParam === 'string' ? dateParam : 'America/Vancouver');
  }

  const config = TARGET_MOMENTS[mode] || TARGET_MOMENTS['1111'];
  const events = cities.map((c) => getNextTargetForCity(c, mode, now, userTimeZone));
  
  // Find currently active cities
  const activeNow = events.filter((e) => e.isCurrentActive).map((e) => e.city);

  // Group events by target UTC minute timestamp
  const groupMap = new Map<number, Next1111Event[]>();
  for (const ev of events) {
    const bucketKey = Math.floor(ev.targetDate.getTime() / 60000) * 60000;
    const existing = groupMap.get(bucketKey) || [];
    existing.push(ev);
    groupMap.set(bucketKey, existing);
  }

  const groupedSlots: Grouped1111Slot[] = Array.from(groupMap.entries())
    .map(([bucketTime, evList]) => {
      const targetDate = new Date(bucketTime);
      const remainingMs = Math.max(0, targetDate.getTime() - now.getTime());
      const primaryEv = evList[0];
      const primaryCity = primaryEv.city;

      // Distinct city names in order
      const cityNames = Array.from(new Set(evList.map((e) => e.city.name)));

      const isCurrentActive = evList.some((e) => e.isCurrentActive);
      const gmtOffsetFormatted = getGmtOffsetString(now, primaryCity.timeZone);

      const clockNowFormatted = formatCurrentTzTime(now, primaryCity.timeZone);
      
      const targetUtcHours = targetDate.getUTCHours().toString().padStart(2, '0');
      const targetUtcMins = targetDate.getUTCMinutes().toString().padStart(2, '0');
      const targetUtcSecs = targetDate.getUTCSeconds().toString().padStart(2, '0');
      const utcTargetFormatted = `at ${targetUtcHours}:${targetUtcMins}:${targetUtcSecs} UTC`;

      const approxMinutes = Math.round(remainingMs / 60000);
      const approxMinutesText =
        approxMinutes <= 1
          ? 'in less than a minute'
          : `≈ ${approxMinutes} minutes from now`;

      const allAm = evList.every((e) => e.period === 'AM');
      const allPm = evList.every((e) => e.period === 'PM');
      const localPeriodFormatted = allAm
        ? `${config.label} AM local time`
        : allPm
        ? `${config.label} PM local time`
        : `${config.label} AM / PM local time`;

      return {
        id: `slot-${bucketTime}`,
        targetDate,
        remainingMs,
        cities: evList,
        cityNames,
        primaryCity,
        primaryTz: primaryCity.timeZone,
        gmtOffsetFormatted,
        localPeriodFormatted,
        clockNowFormatted,
        utcTargetFormatted,
        approxMinutesText,
        isCurrentActive,
        mode,
      };
    })
    .sort((a, b) => a.remainingMs - b.remainingMs);

  const primarySlot = groupedSlots[0] || {
    id: 'slot-default',
    targetDate: new Date(),
    remainingMs: 0,
    cities: events,
    cityNames: ['Vancouver'],
    primaryCity: cities[0],
    primaryTz: cities[0]?.timeZone || 'America/Vancouver',
    gmtOffsetFormatted: 'GMT-7',
    localPeriodFormatted: `${config.label} AM local time`,
    clockNowFormatted: '11:11:00',
    utcTargetFormatted: 'at 18:11:00 UTC',
    approxMinutesText: 'in less than a minute',
    isCurrentActive: false,
    mode,
  };

  const primary = primarySlot.cities[0] || events[0];

  // Also get user's local city or custom local calculation
  const userCity = cities.find((c) => c.timeZone === userTimeZone) || {
    id: 'user-local',
    name: 'Vancouver',
    country: 'Canada',
    countryCode: 'CA',
    flag: '🇨🇦',
    timeZone: userTimeZone,
    region: 'Americas' as const,
    lat: 49.28,
    lng: -123.12,
    baseOffsetUtc: 'UTC-7',
  };
  const userLocalNext = getNextTargetForCity(userCity, mode, now, userTimeZone);

  // Past events calculation across all cities
  const pastEvents = cities.map((c) => getPastTargetForCity(c, mode, now, userTimeZone));
  const pastGroupMap = new Map<number, Next1111Event[]>();
  for (const ev of pastEvents) {
    const bucketKey = Math.floor(ev.targetDate.getTime() / 60000) * 60000;
    const existing = pastGroupMap.get(bucketKey) || [];
    existing.push(ev);
    pastGroupMap.set(bucketKey, existing);
  }

  const pastSlots: Grouped1111Slot[] = Array.from(pastGroupMap.entries())
    .map(([bucketTime, evList]) => {
      const targetDate = new Date(bucketTime);
      const elapsedMs = Math.max(0, now.getTime() - targetDate.getTime());
      const primaryEv = evList[0];
      const primaryCity = primaryEv.city;
      const cityNames = Array.from(new Set(evList.map((e) => e.city.name)));
      const isCurrentActive = evList.some((e) => e.isCurrentActive);
      const gmtOffsetFormatted = getGmtOffsetString(now, primaryCity.timeZone);
      const clockNowFormatted = formatCurrentTzTime(now, primaryCity.timeZone);

      const targetUtcHours = targetDate.getUTCHours().toString().padStart(2, '0');
      const targetUtcMins = targetDate.getUTCMinutes().toString().padStart(2, '0');
      const targetUtcSecs = targetDate.getUTCSeconds().toString().padStart(2, '0');
      const utcTargetFormatted = `at ${targetUtcHours}:${targetUtcMins}:${targetUtcSecs} UTC`;

      const approxMinutes = Math.round(elapsedMs / 60000);
      const approxMinutesText =
        approxMinutes <= 1
          ? 'less than a minute ago'
          : `≈ ${approxMinutes} minutes ago`;

      const allAm = evList.every((e) => e.period === 'AM');
      const allPm = evList.every((e) => e.period === 'PM');
      const localPeriodFormatted = allAm
        ? `${config.label} AM local time`
        : allPm
        ? `${config.label} PM local time`
        : `${config.label} AM / PM local time`;

      return {
        id: `past-slot-${bucketTime}`,
        targetDate,
        remainingMs: -elapsedMs,
        elapsedMs,
        cities: evList,
        cityNames,
        primaryCity,
        primaryTz: primaryCity.timeZone,
        gmtOffsetFormatted,
        localPeriodFormatted,
        clockNowFormatted,
        utcTargetFormatted,
        approxMinutesText,
        isCurrentActive,
        mode,
        isPast: true,
      };
    })
    .sort((a, b) => (a.elapsedMs ?? 0) - (b.elapsedMs ?? 0));

  const sortedUpcoming = [...events].sort((a, b) => a.remainingMs - b.remainingMs);

  return {
    primarySlot,
    primary,
    activeNow,
    groupedUpcoming: groupedSlots,
    pastSlots,
    upcomingTimeline: sortedUpcoming,
    userLocalNext,
    mode,
    config,
  };
}

/**
 * Backward-compatible wrapper for 11:11 worldwide
 */
export function getNext1111Worldwide(
  cities: CityTimeZone[] = WORLD_CITIES,
  nowOrTz?: Date | string,
  maybeUserTimeZone?: string
) {
  return getNextTargetWorldwide('1111', cities, nowOrTz, maybeUserTimeZone);
}

/**
 * Helper for 4:20 worldwide
 */
export function getNext420Worldwide(
  cities: CityTimeZone[] = WORLD_CITIES,
  nowOrTz?: Date | string,
  maybeUserTimeZone?: string
) {
  return getNextTargetWorldwide('420', cities, nowOrTz, maybeUserTimeZone);
}

/**
 * Format remaining milliseconds to { hours, minutes, seconds, totalSeconds }
 */
export function formatCountdown(ms: number): { hours: string; minutes: string; seconds: string; totalSeconds: number } {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    hours: hours.toString().padStart(2, '0'),
    minutes: minutes.toString().padStart(2, '0'),
    seconds: seconds.toString().padStart(2, '0'),
    totalSeconds,
  };
}

/**
 * Human readable countdown string like "8 min 49 s" or "1 h 08 min 49 s"
 */
export function formatCountdownHuman(ms: number): string {
  const { hours, minutes, seconds } = formatCountdown(ms);
  const h = parseInt(hours, 10);
  const m = parseInt(minutes, 10);
  const s = parseInt(seconds, 10);

  if (h > 0) {
    return `${h} h ${minutes} min ${seconds} s`;
  }
  return `${m} min ${seconds} s`;
}

/**
 * Human readable elapsed string like "8 min 49 s ago" or "1 h 08 min ago"
 */
export function formatElapsedHuman(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours} h ${minutes.toString().padStart(2, '0')} min ago`;
  }
  if (minutes > 0) {
    return `${minutes} min ${seconds.toString().padStart(2, '0')} s ago`;
  }
  return `${seconds} s ago`;
}

/**
 * Formats current clock time in any timezone (HH:MM:SS)
 */
export function formatCurrentTzTime(dateOrTz?: Date | string, maybeTz?: string): string {
  let date: Date;
  let timeZone: string;

  if (typeof dateOrTz === 'string') {
    timeZone = dateOrTz;
    date = new Date();
  } else {
    date = ensureDate(dateOrTz);
    timeZone = maybeTz || 'UTC';
  }

  try {
    return getCachedFormatter('en-GB', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(date);
  } catch {
    return '--:--:--';
  }
}

/**
 * Formats current clock time in 12-hour format (HH:MM:SS AM/PM)
 */
export function formatCurrentTzTime12(dateOrTz?: Date | string, maybeTz?: string): string {
  let date: Date;
  let timeZone: string;

  if (typeof dateOrTz === 'string') {
    timeZone = dateOrTz;
    date = new Date();
  } else {
    date = ensureDate(dateOrTz);
    timeZone = maybeTz || 'UTC';
  }

  try {
    return getCachedFormatter('en-US', {
      timeZone,
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }).format(date);
  } catch {
    return '--:--:--';
  }
}


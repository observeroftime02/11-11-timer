import { CityTimeZone, Next1111Event, Grouped1111Slot } from '../types';
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
    const formatter = new Intl.DateTimeFormat('en-US', {
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
  
  // Refine guess up to 3 times to account for timezone offsets and daylight saving transitions
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
    const formatter = new Intl.DateTimeFormat('en-US', {
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
 * Calculates the next 11:11 event (either AM or PM) for a specific city.
 */
export function getNext1111ForCity(
  city: CityTimeZone,
  now: Date = new Date(),
  userTimeZone: string = 'America/Vancouver'
): Next1111Event {
  const local = getTzParts(now, city.timeZone);
  
  // Is it 11:11:xx right now?
  const isAm1111Now = local.hour === 11 && local.minute === 11;
  const isPm1111Now = local.hour === 23 && local.minute === 11;
  const isCurrentActive = isAm1111Now || isPm1111Now;

  // Potential local targets:
  const candidates: { hour: number; dayOffset: number; period: 'AM' | 'PM' }[] = [
    { hour: 11, dayOffset: 0, period: 'AM' },
    { hour: 23, dayOffset: 0, period: 'PM' },
    { hour: 11, dayOffset: 1, period: 'AM' },
    { hour: 23, dayOffset: 1, period: 'PM' },
  ];

  let nextTargetDate: Date | null = null;
  let nextPeriod: 'AM' | 'PM' = 'AM';
  let minRemaining = Infinity;
  const nowMs = now.getTime();

  for (const cand of candidates) {
    const targetLocalDay = local.day + cand.dayOffset;
    const targetDate = findUtcForTzLocalTime(local.year, local.month, targetLocalDay, cand.hour, 11, city.timeZone);
    const remaining = targetDate.getTime() - nowMs;

    if (remaining > 0 && remaining < minRemaining) {
      minRemaining = remaining;
      nextTargetDate = targetDate;
      nextPeriod = cand.period;
    }
  }

  if (!nextTargetDate) {
    nextTargetDate = findUtcForTzLocalTime(local.year, local.month, local.day + 1, 11, 11, city.timeZone);
    nextPeriod = 'AM';
    minRemaining = nextTargetDate.getTime() - nowMs;
  }

  const userFormatter = new Intl.DateTimeFormat('en-US', {
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
    localTimeFormatted: `11:11 ${nextPeriod}`,
    userTimeFormatted: userFormatter.format(nextTargetDate),
    isCurrentActive,
  };
}

/**
 * Returns grouped 11:11 slots across all cities worldwide.
 * Groups cities that hit 11:11 (AM or PM) at the exact same target UTC second.
 */
export function getNext1111Worldwide(
  cities: CityTimeZone[] = WORLD_CITIES,
  nowOrTz?: Date | string,
  maybeUserTimeZone?: string
): {
  primarySlot: Grouped1111Slot;
  primary: Next1111Event;
  activeNow: CityTimeZone[];
  groupedUpcoming: Grouped1111Slot[];
  upcomingTimeline: Next1111Event[];
  userLocalNext: Next1111Event;
} {
  let now: Date;
  let userTimeZone: string;

  if (typeof nowOrTz === 'string') {
    userTimeZone = nowOrTz;
    now = new Date();
  } else {
    now = ensureDate(nowOrTz);
    userTimeZone = maybeUserTimeZone || 'America/Vancouver';
  }

  const events = cities.map((c) => getNext1111ForCity(c, now, userTimeZone));
  
  // Find currently active cities (where it is 11:11:xx right now)
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
        ? '11:11 AM local time'
        : allPm
        ? '11:11 PM local time'
        : '11:11 AM / PM local time';

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
      };
    })
    .sort((a, b) => a.remainingMs - b.remainingMs);

  const primarySlot = groupedSlots[0];
  const primary = primarySlot.cities[0];

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
  const userLocalNext = getNext1111ForCity(userCity, now, userTimeZone);

  const sortedUpcoming = [...events].sort((a, b) => a.remainingMs - b.remainingMs);

  return {
    primarySlot,
    primary,
    activeNow,
    groupedUpcoming: groupedSlots,
    upcomingTimeline: sortedUpcoming,
    userLocalNext,
  };
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
    return new Intl.DateTimeFormat('en-GB', {
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
    return new Intl.DateTimeFormat('en-US', {
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

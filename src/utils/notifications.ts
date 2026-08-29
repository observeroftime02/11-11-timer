import { NotificationPreferences, CityTimeZone, TrackerMode } from '../types';
import { WORLD_CITIES } from '../data/timezones';
import { getNextTargetForCity, findUtcForTzLocalTime, getTzParts, TARGET_MOMENTS, getCachedFormatter } from './timeEngine';

const STORAGE_KEY_PREFS = '1111_notification_prefs';

export const DEFAULT_NOTIFICATION_PREFS: NotificationPreferences = {
  enabled: false,
  soundEnabled: true,
  scope: 'worldwide',
  notifyMinutesBefore: 0,
  favoriteCityIds: ['vancouver', 'tokyo', 'london', 'new-york', 'delhi'],
  enable420: true,
  notify1111: true,
  notify420: true,
};

export function loadNotificationPrefs(): NotificationPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFS);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_NOTIFICATION_PREFS,
        ...parsed,
        enable420: parsed.enable420 !== undefined ? parsed.enable420 : true,
        notify1111: parsed.notify1111 !== undefined ? parsed.notify1111 : true,
        notify420: parsed.notify420 !== undefined ? parsed.notify420 : true,
      };
    }
  } catch {
    // ignore
  }
  return DEFAULT_NOTIFICATION_PREFS;
}

export function saveNotificationPrefs(prefs: NotificationPreferences): void {
  try {
    localStorage.setItem(STORAGE_KEY_PREFS, JSON.stringify(prefs));
  } catch {
    // ignore
  }
}

export const NOTIFICATION_CHANNEL_1111_ID = 'next1111_harmonic_chime';
export const NOTIFICATION_CHANNEL_420_ID = 'next420_chill_chime';
export const NOTIFICATION_CHANNEL_ID = NOTIFICATION_CHANNEL_1111_ID; // alias for backwards compatibility
export const NOTIFICATION_SOUND = 'chime.wav';
export const NOTIFICATION_SOUND_420 = 'chime_420.wav';

/**
 * Play a peaceful crystal chime or mellow zen chime depending on mode
 */
export function playChimeSound(mode: TrackerMode = '1111'): void {
  const audioFile = mode === '420' ? '/chime-420.wav' : '/chime.wav';

  try {
    if (typeof Audio !== 'undefined') {
      const audio = new Audio(audioFile);
      audio.volume = 0.85;
      const playPromise = audio.play();
      if (playPromise) {
        playPromise.catch(() => {
          if (mode === '420') {
            synthesizeChillTone();
          } else {
            synthesizeChimeWebAudio();
          }
        });
        return;
      }
    }
  } catch {
    // ignore and fallback
  }

  if (mode === '420') {
    synthesizeChillTone();
  } else {
    synthesizeChimeWebAudio();
  }
}

export function synthesizeChimeWebAudio(): void {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    // Solfeggio / Harmonic crystal chime: 528Hz (Love tone), 660Hz, 792Hz, 1056Hz, 1320Hz
    const freqs = [528, 660, 792, 1056, 1320];
    const now = ctx.currentTime;

    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = idx === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0.001, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.18 / (idx + 1), now + idx * 0.08 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 2.8);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 3.0);
    });
  } catch {
    // ignore audio block
  }
}

export function synthesizeChillTone(): void {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    // Mellow 432Hz relaxation chord: 216Hz, 324Hz, 432Hz, 648Hz (Warm bamboo chime vibe)
    const freqs = [216, 324, 432, 648];
    const now = ctx.currentTime;

    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.1);

      gain.gain.setValueAtTime(0.001, now + idx * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.15 / (idx + 1), now + idx * 0.1 + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.1 + 3.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.1);
      osc.stop(now + idx * 0.1 + 3.5);
    });
  } catch {
    // ignore audio block
  }
}

// Safe dynamic getter for Capacitor plugins
async function getCapacitorPlugins() {
  try {
    const capacitorCore = await import('@capacitor/core').catch(() => null);
    const localNotifs = await import('@capacitor/local-notifications').catch(() => null);
    const isNative = capacitorCore?.Capacitor?.isNativePlatform?.() ?? false;
    return {
      isNative,
      LocalNotifications: localNotifs?.LocalNotifications || null,
    };
  } catch {
    return { isNative: false, LocalNotifications: null };
  }
}

/**
 * Check current notification permission status across Native Android & Web
 */
export async function getNotificationPermissionStatus(): Promise<'granted' | 'denied' | 'prompt' | 'unsupported'> {
  const { isNative, LocalNotifications } = await getCapacitorPlugins();

  if (isNative && LocalNotifications) {
    try {
      const status = await LocalNotifications.checkPermissions();
      if (status.display === 'granted') return 'granted';
      if (status.display === 'denied') return 'denied';
      return 'prompt';
    } catch {
      return 'prompt';
    }
  }

  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'granted') return 'granted';
    if (Notification.permission === 'denied') return 'denied';
    return 'prompt';
  }

  return 'prompt';
}

/**
 * Request notification permission and initialize high-priority notification channel
 */
export async function requestNotificationPermission(): Promise<boolean> {
  const { isNative, LocalNotifications } = await getCapacitorPlugins();

  // 1. Native Android / Capacitor path
  if (isNative && LocalNotifications) {
    try {
      const req = await LocalNotifications.requestPermissions();
      if (req.display === 'granted') {
        try {
          // Channel 1: 11:11 Solfeggio Crystal Chime
          await LocalNotifications.createChannel({
            id: NOTIFICATION_CHANNEL_1111_ID,
            name: '11:11 Worldwide Crystal Chimes',
            description: 'Notifies when 11:11 strikes worldwide with a 528Hz peaceful crystal chime',
            importance: 5, // High priority (heads-up notification)
            visibility: 1, // Public on lockscreen
            sound: NOTIFICATION_SOUND,
            vibration: true,
            lights: true,
            lightColor: '#F59E0B',
          });

          // Channel 2: 4:20 Mellow Zen Chill Chime
          await LocalNotifications.createChannel({
            id: NOTIFICATION_CHANNEL_420_ID,
            name: '4:20 Worldwide Chill Chimes',
            description: 'Notifies when 4:20 strikes worldwide with a 432Hz mellow resonant chime',
            importance: 5, // High priority
            visibility: 1, // Public on lockscreen
            sound: NOTIFICATION_SOUND_420,
            vibration: true,
            lights: true,
            lightColor: '#10B981',
          });
        } catch {
          // ignore channel error
        }
        return true;
      }
      return false;
    } catch {
      return true; // allow in-app fallback
    }
  }

  // 2. Web Browser standard path
  if (typeof window !== 'undefined' && 'Notification' in window) {
    try {
      if (Notification.permission === 'granted') {
        return true;
      }
      if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
      }
      return false;
    } catch {
      return true;
    }
  }

  return true;
}

// Track notified slots to ensure each 11:11 or 4:20 event is notified exactly once
const NOTIFIED_SLOTS_KEY = '1111_notified_event_slots';
const notifiedSlotsInMemory = new Set<string>();

/**
 * Checks if a specific minute event slot has already been notified.
 */
export function isSlotAlreadyNotified(slotKey: string): boolean {
  if (notifiedSlotsInMemory.has(slotKey)) return true;
  try {
    const raw = sessionStorage.getItem(NOTIFIED_SLOTS_KEY);
    if (raw) {
      const arr: string[] = JSON.parse(raw);
      if (arr.includes(slotKey)) {
        notifiedSlotsInMemory.add(slotKey);
        return true;
      }
    }
  } catch {
    // ignore
  }
  return false;
}

/**
 * Marks a specific minute event slot as notified to prevent duplicate dispatches.
 */
export function markSlotNotified(slotKey: string): void {
  notifiedSlotsInMemory.add(slotKey);
  try {
    let arr: string[] = [];
    const raw = sessionStorage.getItem(NOTIFIED_SLOTS_KEY);
    if (raw) {
      arr = JSON.parse(raw);
    }
    if (!arr.includes(slotKey)) {
      arr.push(slotKey);
      // Keep only the most recent 100 slots to avoid unbounded storage growth
      if (arr.length > 100) {
        arr = arr.slice(arr.length - 100);
      }
      sessionStorage.setItem(NOTIFIED_SLOTS_KEY, JSON.stringify(arr));
    }
  } catch {
    // ignore
  }
}

/**
 * Generates a deterministic, positive 31-bit integer ID for a notification.
 * Using a deterministic ID ensures Android AlarmManager updates the exact same alarm
 * rather than creating duplicate stacked alarms for the same time slot.
 */
export function generateDeterministicNotificationId(triggerBucketMs: number, mode: TrackerMode): number {
  const minuteIndex = Math.floor(triggerBucketMs / 60000);
  const modeModifier = mode === '420' ? 4200000 : 1111000;
  // Calculate deterministic hash within positive 31-bit integer range (1000 - 2,000,000,000)
  const hash = Math.abs((minuteIndex * 31 + modeModifier) % 1999999000);
  return hash + 1000;
}

/**
 * Generates future target timestamps for a given city over the next N days
 */
function getFutureDatesForCity(
  city: CityTimeZone,
  mode: TrackerMode,
  daysAhead: number = 2
): { date: Date; period: 'AM' | 'PM'; mode: TrackerMode }[] {
  const config = TARGET_MOMENTS[mode] || TARGET_MOMENTS['1111'];
  const now = new Date();
  const local = getTzParts(now, city.timeZone);
  const results: { date: Date; period: 'AM' | 'PM'; mode: TrackerMode }[] = [];

  for (let d = 0; d <= daysAhead; d++) {
    const targetDay = local.day + d;
    
    // AM target
    const amDate = findUtcForTzLocalTime(local.year, local.month, targetDay, config.amHour, config.targetMinute, city.timeZone);
    if (amDate.getTime() > now.getTime() + 10000) {
      results.push({ date: amDate, period: 'AM', mode });
    }

    // PM target
    const pmDate = findUtcForTzLocalTime(local.year, local.month, targetDay, config.pmHour, config.targetMinute, city.timeZone);
    if (pmDate.getTime() > now.getTime() + 10000) {
      results.push({ date: pmDate, period: 'PM', mode });
    }
  }

  return results;
}

/**
 * Format a list of simultaneous cities into a readable title & description
 */
export function formatOccurrenceNotification(
  cities: CityTimeZone[],
  period: 'AM' | 'PM',
  userLocalTimeFormatted: string,
  notifyMinutesBefore: number = 0,
  mode: TrackerMode = '1111'
): { title: string; body: string } {
  const is420 = mode === '420';
  const label = is420 ? '4:20' : '11:11';
  const icon = is420 ? '🌿' : '✨';
  const actionText = is420 ? 'Catch the vibe!' : 'Make a wish!';

  if (!cities || cities.length === 0) {
    return {
      title: `${icon} It's ${label}!`,
      body: `${actionText} ${label} has arrived (${userLocalTimeFormatted} locally).`,
    };
  }

  const primaryCity = cities[0];
  const count = cities.length;

  let title = '';
  let body = '';

  if (notifyMinutesBefore > 0) {
    if (count === 1) {
      title = `⏳ ${label} in ${primaryCity.name} in ${notifyMinutesBefore} min!`;
      body = `${label} ${period} is approaching in ${primaryCity.name}, ${primaryCity.country} at ${userLocalTimeFormatted} locally.`;
    } else if (count === 2) {
      title = `⏳ ${label} in ${primaryCity.name} & ${cities[1].name} in ${notifyMinutesBefore} min!`;
      body = `${label} is approaching simultaneously in ${primaryCity.name} and ${cities[1].name} at ${userLocalTimeFormatted} locally.`;
    } else {
      title = `⏳ ${label} in ${primaryCity.name}, ${cities[1].name} & ${count - 2} more in ${notifyMinutesBefore} min!`;
      const cityListStr = cities.slice(0, 4).map((c) => c.name).join(', ') + (count > 4 ? ` +${count - 4} more` : '');
      body = `${label} is approaching across ${cityListStr} at ${userLocalTimeFormatted} locally.`;
    }
  } else {
    if (count === 1) {
      title = `${icon} It's ${label} ${period} in ${primaryCity.name}!`;
      body = `${actionText} ${label} ${period} has arrived in ${primaryCity.name}, ${primaryCity.country} (${userLocalTimeFormatted} locally).`;
    } else if (count === 2) {
      title = `${icon} It's ${label} in ${primaryCity.name} & ${cities[1].name}!`;
      body = `${actionText} ${label} strikes simultaneously in ${primaryCity.name} and ${cities[1].name} (${userLocalTimeFormatted} locally).`;
    } else {
      title = `${icon} It's ${label} in ${primaryCity.name}, ${cities[1].name} & ${count - 2} other places!`;
      const cityListStr = cities.slice(0, 4).map((c) => c.name).join(', ') + (count > 4 ? ` +${count - 4} more` : '');
      body = `${actionText} ${label} strikes across ${cityListStr} (${userLocalTimeFormatted} locally).`;
    }
  }

  return { title, body };
}

/**
 * Schedules native background alarms in Android AlarmManager for upcoming moments.
 * Supports both 11:11 and 4:20 occurrences.
 */
export async function syncScheduled1111Notifications(
  prefs: NotificationPreferences,
  favoriteCityIds: string[] = ['vancouver', 'tokyo', 'london', 'new-york', 'delhi'],
  userTimeZone: string = 'America/Vancouver'
): Promise<number> {
  const { isNative, LocalNotifications } = await getCapacitorPlugins();
  if (!isNative || !LocalNotifications) return 0;

  try {
    // 1. Cancel all previous pending notifications
    const pending = await LocalNotifications.getPending();
    if (pending.notifications && pending.notifications.length > 0) {
      await LocalNotifications.cancel({ notifications: pending.notifications });
    }

    if (!prefs.enabled) {
      return 0;
    }

    // Ensure both notification channels exist in case they were cleared
    try {
      await LocalNotifications.createChannel({
        id: NOTIFICATION_CHANNEL_1111_ID,
        name: '11:11 Worldwide Crystal Chimes',
        description: 'Notifies when 11:11 strikes worldwide with a 528Hz peaceful crystal chime',
        importance: 5,
        visibility: 1,
        sound: NOTIFICATION_SOUND,
        vibration: true,
        lights: true,
        lightColor: '#F59E0B',
      });
      await LocalNotifications.createChannel({
        id: NOTIFICATION_CHANNEL_420_ID,
        name: '4:20 Worldwide Chill Chimes',
        description: 'Notifies when 4:20 strikes worldwide with a 432Hz mellow resonant chime',
        importance: 5,
        visibility: 1,
        sound: NOTIFICATION_SOUND_420,
        vibration: true,
        lights: true,
        lightColor: '#10B981',
      });
    } catch {
      // ignore
    }

    // 2. Determine target cities based on scope
    let targetCities: CityTimeZone[] = [];
    if (prefs.scope === 'local_only') {
      const userCity = WORLD_CITIES.find((c) => c.timeZone === userTimeZone) || WORLD_CITIES[0];
      targetCities = [userCity];
    } else if (prefs.scope === 'favorites') {
      targetCities = WORLD_CITIES.filter((c) => favoriteCityIds.includes(c.id));
      if (targetCities.length === 0) targetCities = [WORLD_CITIES[0]];
    } else {
      // Worldwide
      targetCities = WORLD_CITIES;
    }

    // Determine which modes to schedule based on alert channel preferences
    const activeModes: TrackerMode[] = [];
    if (prefs.notify1111 !== false) activeModes.push('1111');
    if (prefs.notify420 !== false) activeModes.push('420');
    if (activeModes.length === 0) activeModes.push('1111');

    // 3. Collect and group all future candidate moments
    const now = Date.now();
    const minutesOffsetMs = (prefs.notifyMinutesBefore || 0) * 60 * 1000;
    const slotMap = new Map<string, { cities: CityTimeZone[]; period: 'AM' | 'PM'; targetTimeMs: number; mode: TrackerMode }>();

    for (const mode of activeModes) {
      for (const city of targetCities) {
        const futureDates = getFutureDatesForCity(city, mode, prefs.scope === 'local_only' ? 7 : 2);
        for (const item of futureDates) {
          const targetTimeMs = item.date.getTime();
          const triggerTimeMs = targetTimeMs - minutesOffsetMs;
          if (triggerTimeMs <= now + 5000) continue; // must be in future

          const bucketKey = `${mode}-${Math.floor(triggerTimeMs / 60000) * 60000}`;
          const existing = slotMap.get(bucketKey);
          if (existing) {
            if (!existing.cities.some((c) => c.id === city.id)) {
              existing.cities.push(city);
            }
          } else {
            slotMap.set(bucketKey, {
              cities: [city],
              period: item.period,
              targetTimeMs,
              mode,
            });
          }
        }
      }
    }

    // 4. Sort distinct chronological occurrence slots
    const sortedSlots = Array.from(slotMap.entries()).sort((a, b) => {
      const timeA = parseInt(a[0].split('-')[1], 10);
      const timeB = parseInt(b[0].split('-')[1], 10);
      return timeA - timeB;
    });

    const notificationList: Array<{
      id: number;
      title: string;
      body: string;
      channelId: string;
      schedule: { at: Date; allowWhileIdle?: boolean };
      smallIcon: string;
      sound?: string;
      extra: any;
    }> = [];

    for (const [key, slotData] of sortedSlots) {
      const triggerBucketMs = parseInt(key.split('-')[1], 10);
      const userFormatter = getCachedFormatter('en-US', {
        timeZone: userTimeZone,
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
      const userTimeFormatted = userFormatter.format(new Date(slotData.targetTimeMs));

      const { title, body } = formatOccurrenceNotification(
        slotData.cities,
        slotData.period,
        userTimeFormatted,
        prefs.notifyMinutesBefore,
        slotData.mode
      );

      // Use deterministic ID based on timestamp and mode to avoid duplicate/stacked alarms
      const notifId = generateDeterministicNotificationId(triggerBucketMs, slotData.mode);
      const isSlot420 = slotData.mode === '420';
      const slotChannelId = isSlot420 ? NOTIFICATION_CHANNEL_420_ID : NOTIFICATION_CHANNEL_1111_ID;
      const slotSound = isSlot420 ? NOTIFICATION_SOUND_420 : NOTIFICATION_SOUND;

      notificationList.push({
        id: notifId,
        title,
        body,
        channelId: slotChannelId,
        schedule: {
          at: new Date(triggerBucketMs),
          allowWhileIdle: true,
        },
        smallIcon: 'ic_launcher_foreground',
        sound: slotSound,
        extra: {
          cityIds: slotData.cities.map((c) => c.id),
          count: slotData.cities.length,
          period: slotData.period,
          mode: slotData.mode,
        },
      });

      if (notificationList.length >= 45) break;
    }

    if (notificationList.length > 0) {
      await LocalNotifications.schedule({ notifications: notificationList });
    }

    return notificationList.length;
  } catch (err) {
    console.warn('Error synchronizing background notifications:', err);
    return 0;
  }
}

export interface SendNotificationOptions {
  playSound?: boolean;
  dedupeKey?: string;
  isTest?: boolean;
}

/**
 * Send a notification for an occurrence (with built-in deduplication and audio control)
 */
export async function send1111Notification(
  cityOrCities: CityTimeZone | CityTimeZone[],
  period: 'AM' | 'PM',
  userLocalTimeFormatted: string,
  mode: TrackerMode = '1111',
  options?: SendNotificationOptions
): Promise<void> {
  const cities = Array.isArray(cityOrCities) ? cityOrCities : [cityOrCities];
  const { title, body } = formatOccurrenceNotification(cities, period, userLocalTimeFormatted, 0, mode);

  const { isNative, LocalNotifications } = await getCapacitorPlugins();

  const isMode420 = mode === '420';
  const targetChannelId = isMode420 ? NOTIFICATION_CHANNEL_420_ID : NOTIFICATION_CHANNEL_1111_ID;
  const targetSound = isMode420 ? NOTIFICATION_SOUND_420 : NOTIFICATION_SOUND;
  const shouldPlaySound = options?.playSound !== false;

  // 1. Native Android Notification
  if (isNative && LocalNotifications) {
    try {
      // Deterministic notification ID or test ID
      const notifId = options?.isTest
        ? 999999
        : generateDeterministicNotificationId(Date.now(), mode);

      await LocalNotifications.schedule({
        notifications: [
          {
            title,
            body,
            id: notifId,
            channelId: targetChannelId,
            schedule: { at: new Date(Date.now() + 100), allowWhileIdle: true },
            sound: targetSound,
            smallIcon: 'ic_launcher_foreground',
            actionTypeId: '',
            extra: {
              cityIds: cities.map((c) => c.id),
              period,
              mode,
            },
          },
        ],
      });
      return;
    } catch (err) {
      console.warn('Native notification dispatch error:', err);
    }
  }

  // 2. Web Notification (with deterministic tag to auto-deduplicate duplicate tabs/calls)
  const dedupeTag = options?.dedupeKey || `${mode}-moment-${Math.floor(Date.now() / 60000)}`;

  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        tag: dedupeTag,
        icon: '/icon.svg',
      });
    } catch {
      // ignore
    }
  }

  // Play audio tone once if requested
  if (shouldPlaySound) {
    playChimeSound(mode);
  }
}

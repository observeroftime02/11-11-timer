import { NotificationPreferences, CityTimeZone } from '../types';
import { WORLD_CITIES } from '../data/timezones';
import { getNext1111ForCity, findUtcForTzLocalTime, getTzParts } from './timeEngine';

const STORAGE_KEY_PREFS = '1111_notification_prefs';

export const DEFAULT_NOTIFICATION_PREFS: NotificationPreferences = {
  enabled: false,
  soundEnabled: true,
  scope: 'worldwide',
  notifyMinutesBefore: 0,
  favoriteCityIds: ['vancouver', 'tokyo', 'london', 'new-york', 'delhi'],
};

export function loadNotificationPrefs(): NotificationPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFS);
    if (raw) return { ...DEFAULT_NOTIFICATION_PREFS, ...JSON.parse(raw) };
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

export const NOTIFICATION_CHANNEL_ID = 'next1111_harmonic_chime';
export const NOTIFICATION_SOUND = 'chime.wav';

/**
 * Play a peaceful crystal chime using Web Audio API or /chime.wav audio
 */
export function playChimeSound(): void {
  try {
    // Try HTML5 Audio element first if supported
    if (typeof Audio !== 'undefined') {
      const audio = new Audio('/chime.wav');
      audio.volume = 0.85;
      const playPromise = audio.play();
      if (playPromise) {
        playPromise.catch(() => {
          // Fallback to Web Audio oscillator synthesis if autoplay policy blocks file audio
          synthesizeChimeWebAudio();
        });
        return;
      }
    }
  } catch {
    // ignore and fallback
  }

  synthesizeChimeWebAudio();
}

function synthesizeChimeWebAudio(): void {
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
 * Request notification permission and initialize high-priority notification channel with custom chime
 */
export async function requestNotificationPermission(): Promise<boolean> {
  const { isNative, LocalNotifications } = await getCapacitorPlugins();

  // 1. Native Android / Capacitor path
  if (isNative && LocalNotifications) {
    try {
      const req = await LocalNotifications.requestPermissions();
      if (req.display === 'granted') {
        try {
          // Delete old default-sound channel if it exists
          try {
            await LocalNotifications.deleteChannel({ id: 'next1111_alerts' });
          } catch {
            // ignore
          }

          await LocalNotifications.createChannel({
            id: NOTIFICATION_CHANNEL_ID,
            name: '11:11 Worldwide Alerts',
            description: 'Notifies when 11:11 AM or PM strikes with a peaceful harmonic crystal chime',
            importance: 5, // High priority (pops over screen)
            visibility: 1, // Public on lockscreen
            sound: NOTIFICATION_SOUND,
            vibration: true,
            lights: true,
            lightColor: '#F59E0B',
          });
        } catch {
          // ignore channel error on older devices
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

/**
 * Generates future 11:11 timestamps for a given city over the next N days
 */
function getFuture1111DatesForCity(city: CityTimeZone, daysAhead: number = 2): { date: Date; period: 'AM' | 'PM' }[] {
  const now = new Date();
  const local = getTzParts(now, city.timeZone);
  const results: { date: Date; period: 'AM' | 'PM' }[] = [];

  for (let d = 0; d <= daysAhead; d++) {
    const targetDay = local.day + d;
    
    // 11:11 AM
    const amDate = findUtcForTzLocalTime(local.year, local.month, targetDay, 11, 11, city.timeZone);
    if (amDate.getTime() > now.getTime() + 10000) {
      results.push({ date: amDate, period: 'AM' });
    }

    // 11:11 PM (23:11)
    const pmDate = findUtcForTzLocalTime(local.year, local.month, targetDay, 23, 11, city.timeZone);
    if (pmDate.getTime() > now.getTime() + 10000) {
      results.push({ date: pmDate, period: 'PM' });
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
  notifyMinutesBefore: number = 0
): { title: string; body: string } {
  if (!cities || cities.length === 0) {
    return {
      title: "✨ It's 11:11!",
      body: `Make a wish! 11:11 has arrived (${userLocalTimeFormatted} locally).`,
    };
  }

  const primaryCity = cities[0];
  const count = cities.length;

  let title = '';
  let body = '';

  if (notifyMinutesBefore > 0) {
    if (count === 1) {
      title = `⏳ 11:11 in ${primaryCity.name} in ${notifyMinutesBefore} min!`;
      body = `11:11 ${period} is approaching in ${primaryCity.name}, ${primaryCity.country} at ${userLocalTimeFormatted} locally.`;
    } else if (count === 2) {
      title = `⏳ 11:11 in ${primaryCity.name} & ${cities[1].name} in ${notifyMinutesBefore} min!`;
      body = `11:11 is approaching simultaneously in ${primaryCity.name} and ${cities[1].name} at ${userLocalTimeFormatted} locally.`;
    } else {
      title = `⏳ 11:11 in ${primaryCity.name}, ${cities[1].name} & ${count - 2} more in ${notifyMinutesBefore} min!`;
      const cityListStr = cities.slice(0, 4).map((c) => c.name).join(', ') + (count > 4 ? ` +${count - 4} more` : '');
      body = `11:11 is approaching across ${cityListStr} at ${userLocalTimeFormatted} locally.`;
    }
  } else {
    if (count === 1) {
      title = `✨ It's 11:11 ${period} in ${primaryCity.name}!`;
      body = `Make a wish! 11:11 ${period} has arrived in ${primaryCity.name}, ${primaryCity.country} (${userLocalTimeFormatted} locally).`;
    } else if (count === 2) {
      title = `✨ It's 11:11 in ${primaryCity.name} & ${cities[1].name}!`;
      body = `Make a wish! 11:11 strikes simultaneously in ${primaryCity.name} and ${cities[1].name} (${userLocalTimeFormatted} locally).`;
    } else {
      title = `✨ It's 11:11 in ${primaryCity.name}, ${cities[1].name} & ${count - 2} other places!`;
      const cityListStr = cities.slice(0, 4).map((c) => c.name).join(', ') + (count > 4 ? ` +${count - 4} more` : '');
      body = `Make a wish! 11:11 strikes across ${cityListStr} (${userLocalTimeFormatted} locally).`;
    }
  }

  return { title, body };
}

/**
 * Schedules native background alarms in Android AlarmManager for all upcoming 11:11 moments.
 * Groups multiple cities occurring at the exact same minute into ONE single notification per occurrence.
 */
export async function syncScheduled1111Notifications(
  prefs: NotificationPreferences,
  favoriteCityIds: string[] = ['vancouver', 'tokyo', 'london', 'new-york', 'delhi'],
  userTimeZone: string = 'America/Vancouver'
): Promise<number> {
  const { isNative, LocalNotifications } = await getCapacitorPlugins();
  if (!isNative || !LocalNotifications) return 0;

  try {
    // 1. Cancel all previous pending notifications to prevent duplicate alarms
    const pending = await LocalNotifications.getPending();
    if (pending.notifications && pending.notifications.length > 0) {
      await LocalNotifications.cancel({ notifications: pending.notifications });
    }

    if (!prefs.enabled) {
      return 0;
    }

    // Ensure notification channel exists
    try {
      await LocalNotifications.createChannel({
        id: NOTIFICATION_CHANNEL_ID,
        name: '11:11 Worldwide Alerts',
        description: 'Notifies when 11:11 AM or PM strikes with a peaceful harmonic crystal chime',
        importance: 5,
        visibility: 1,
        sound: NOTIFICATION_SOUND,
        vibration: true,
        lights: true,
        lightColor: '#F59E0B',
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

    // 3. Collect and group all future candidate moments by their exact UTC minute timestamp
    const now = Date.now();
    const minutesOffsetMs = (prefs.notifyMinutesBefore || 0) * 60 * 1000;
    const slotMap = new Map<number, { cities: CityTimeZone[]; period: 'AM' | 'PM'; targetTimeMs: number }>();

    for (const city of targetCities) {
      const futureDates = getFuture1111DatesForCity(city, prefs.scope === 'local_only' ? 7 : 2);
      for (const item of futureDates) {
        const targetTimeMs = item.date.getTime();
        const triggerTimeMs = targetTimeMs - minutesOffsetMs;
        if (triggerTimeMs <= now + 5000) continue; // must be in future

        const bucketKey = Math.floor(triggerTimeMs / 60000) * 60000;
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
          });
        }
      }
    }

    // 4. Sort distinct chronological occurrence slots
    const sortedSlots = Array.from(slotMap.entries()).sort((a, b) => a[0] - b[0]);

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

    let counter = 1;

    for (const [triggerBucketMs, slotData] of sortedSlots) {
      const userFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: userTimeZone,
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
      const userTimeFormatted = userFormatter.format(new Date(slotData.targetTimeMs));

      // Consolidated single notification for the entire occurrence
      const { title, body } = formatOccurrenceNotification(
        slotData.cities,
        slotData.period,
        userTimeFormatted,
        prefs.notifyMinutesBefore
      );

      const notifId = (counter++ % 2000000000) + 1000;

      notificationList.push({
        id: notifId,
        title,
        body,
        channelId: NOTIFICATION_CHANNEL_ID,
        schedule: {
          at: new Date(triggerBucketMs),
          allowWhileIdle: true,
        },
        smallIcon: 'ic_launcher_foreground',
        sound: NOTIFICATION_SOUND,
        extra: {
          cityIds: slotData.cities.map((c) => c.id),
          count: slotData.cities.length,
          period: slotData.period,
        },
      });

      if (notificationList.length >= 45) break; // stay within Android Alarm safe thresholds
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

/**
 * Send an immediate push notification for an occurrence (accepts single city or group of simultaneous cities)
 */
export async function send1111Notification(
  cityOrCities: CityTimeZone | CityTimeZone[],
  period: 'AM' | 'PM',
  userLocalTimeFormatted: string
): Promise<void> {
  const cities = Array.isArray(cityOrCities) ? cityOrCities : [cityOrCities];
  const { title, body } = formatOccurrenceNotification(cities, period, userLocalTimeFormatted);

  const { isNative, LocalNotifications } = await getCapacitorPlugins();

  // 1. Native Android Notification
  if (isNative && LocalNotifications) {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title,
            body,
            id: Math.floor(Math.random() * 1000000) + 1,
            channelId: NOTIFICATION_CHANNEL_ID,
            schedule: { at: new Date(Date.now() + 100), allowWhileIdle: true },
            sound: NOTIFICATION_SOUND,
            smallIcon: 'ic_launcher_foreground',
            actionTypeId: '',
            extra: {
              cityIds: cities.map((c) => c.id),
              period,
            },
          },
        ],
      });
      return;
    } catch (err) {
      console.warn('Native notification dispatch error:', err);
    }
  }

  // 2. Web Notification
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        tag: `1111-slot-${Date.now()}`,
        icon: '/icon.svg',
      });
      // Play harmonic crystal chime for web user
      playChimeSound();
    } catch {
      // ignore
    }
  }
}

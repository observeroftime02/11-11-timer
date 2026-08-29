import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Header } from './components/Header';
import { Next1111Hero } from './components/Next1111Hero';
import { UserLocalCard } from './components/UserLocalCard';
import { QueuedWishesCard } from './components/QueuedWishesCard';
import { WorldMapVisualizer } from './components/WorldMapVisualizer';
import { FullScreenMapView } from './components/FullScreenMapView';
import { WorldTimeline } from './components/WorldTimeline';
import { WorldDirectoryView } from './components/WorldDirectoryView';
import { MakeAWishModal } from './components/MakeAWishModal';
import { NotificationModal } from './components/NotificationModal';
import { PrivacyPolicyModal } from './components/PrivacyPolicyModal';
import { AndroidWidgetShowcase } from './components/AndroidWidgetShowcase';
import { WORLD_CITIES } from './data/timezones';
import {
  getNextTargetWorldwide,
  getNextTargetForCity,
  formatCurrentTzTime,
  formatCountdownHuman,
} from './utils/timeEngine';
import {
  loadNotificationPrefs,
  saveNotificationPrefs,
  playChimeSound,
  synthesizeChillTone,
  send1111Notification,
  syncScheduled1111Notifications,
} from './utils/notifications';
import { CityTimeZone, NotificationPreferences, UserWish, TrackerMode } from './types';

const STORAGE_KEY_FAVORITES = '1111_favorite_cities';
const STORAGE_KEY_WISHES = '1111_user_wishes';
const STORAGE_KEY_MODE = '1111_tracker_mode';

export default function App() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'map' | 'world'>('dashboard');
  const [userTimeZone, setUserTimeZone] = useState<string>('America/Vancouver');
  const [trackerMode, setTrackerMode] = useState<TrackerMode>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_MODE);
      if (stored === '1111' || stored === '420') return stored;
    } catch {
      // ignore
    }
    return '1111';
  });
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>(
    loadNotificationPrefs()
  );
  const [favoriteCityIds, setFavoriteCityIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_FAVORITES);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return ['vancouver', 'tokyo', 'london', 'new-york', 'delhi', 'paris', 'sydney', 'gambier', 'athens', 'cairo'];
  });

  const [wishes, setWishes] = useState<UserWish[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_WISHES);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return [];
  });

  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [isWishModalOpen, setIsWishModalOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [isWidgetModalOpen, setIsWidgetModalOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [wishCityContext, setWishCityContext] = useState<string | undefined>();

  // Track previous notified minute to avoid duplicate alerts within the same minute
  const lastNotifiedMinuteRef = useRef<string>('');

  // Main real-time clock ticker with tab-visibility power-saving throttle
  useEffect(() => {
    let timer: NodeJS.Timeout;

    const startTimer = () => {
      // Clear any existing timer
      if (timer) clearInterval(timer);
      
      // Update immediately
      setCurrentTime(new Date());

      // If document is visible, run at 1s interval for smooth countdowns
      // If hidden/backgrounded, throttle to 10s interval to eliminate CPU wakeups and save battery
      const intervalMs = document.visibilityState === 'hidden' ? 10000 : 1000;
      timer = setInterval(() => {
        setCurrentTime(new Date());
      }, intervalMs);
    };

    const handleVisibilityChange = () => {
      startTimer();
    };

    startTimer();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (timer) clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const handleSelectMode = (newMode: TrackerMode) => {
    setTrackerMode(newMode);
    try {
      localStorage.setItem(STORAGE_KEY_MODE, newMode);
    } catch {
      // ignore
    }
  };

  // If 420 mode is disabled in preferences and user is on 420 tab, fallback to 1111
  useEffect(() => {
    if (!notificationPrefs.enable420 && trackerMode === '420') {
      handleSelectMode('1111');
    }
  }, [notificationPrefs.enable420, trackerMode]);

  // Compute real-time target moment worldwide calculations
  const {
    primarySlot,
    primary,
    activeNow,
    groupedUpcoming,
    upcomingTimeline,
    userLocalNext,
  } = getNextTargetWorldwide(WORLD_CITIES, trackerMode, currentTime, userTimeZone);

  // Compute queued upcoming wishes
  const queuedWishes = useMemo(() => {
    const nowMs = currentTime.getTime();
    return wishes
      .filter((wish) => {
        const wishMode: TrackerMode = wish.mode || '1111';
        // If wish has targetTimestamp, check if it's in the future or active now (within 60s past)
        if (wish.targetTimestamp) {
          return wish.targetTimestamp >= nowMs - 60000;
        }
        // If legacy wish without targetTimestamp, dynamically calculate next target moment
        const city = WORLD_CITIES.find(
          (c) => c.name.toLowerCase() === (wish.cityName || '').toLowerCase()
        );
        if (city) {
          const nextEv = getNextTargetForCity(city, wishMode, currentTime);
          return nextEv.remainingMs >= -60000;
        }
        return true;
      })
      .map((wish) => {
        const wishMode: TrackerMode = wish.mode || '1111';
        if (!wish.targetTimestamp) {
          const city = WORLD_CITIES.find(
            (c) => c.name.toLowerCase() === (wish.cityName || '').toLowerCase()
          );
          const targetMs = city
            ? getNextTargetForCity(city, wishMode, currentTime).targetDate.getTime()
            : getNextTargetWorldwide(WORLD_CITIES, wishMode, currentTime).primary.targetDate.getTime();
          return { ...wish, mode: wishMode, targetTimestamp: targetMs };
        }
        return { ...wish, mode: wishMode };
      });
  }, [wishes, currentTime]);

  const handleAddWish = (newWish: UserWish) => {
    const updated = [newWish, ...wishes];
    setWishes(updated);
    try {
      localStorage.setItem(STORAGE_KEY_WISHES, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handleDeleteWish = (id: string) => {
    const updated = wishes.filter((w) => w.id !== id);
    setWishes(updated);
    try {
      localStorage.setItem(STORAGE_KEY_WISHES, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  // Synchronize Favorite cities changes to localStorage
  const handleToggleFavorite = (cityId: string) => {
    setFavoriteCityIds((prev) => {
      const next = prev.includes(cityId)
        ? prev.filter((id) => id !== cityId)
        : [...prev, cityId];
      try {
        localStorage.setItem(STORAGE_KEY_FAVORITES, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Notification Preferences updater
  const handleUpdateNotificationPrefs = (newPrefs: NotificationPreferences) => {
    setNotificationPrefs(newPrefs);
    saveNotificationPrefs(newPrefs);
  };

  // Synchronize background Android AlarmManager alarms whenever preferences change
  useEffect(() => {
    syncScheduled1111Notifications(notificationPrefs, favoriteCityIds, userTimeZone);
  }, [notificationPrefs, favoriteCityIds, userTimeZone]);

  // Check and dispatch automatic notifications (strictly 1 notification per occurrence)
  useEffect(() => {
    if (!notificationPrefs.enabled) return;

    // Check if the current mode is enabled for alerts
    if (trackerMode === '1111' && notificationPrefs.notify1111 === false) return;
    if (trackerMode === '420' && notificationPrefs.notify420 === false) return;

    const currentMinuteKey = `${trackerMode}-${new Date().getUTCHours()}:${new Date().getUTCMinutes()}`;
    if (lastNotifiedMinuteRef.current === currentMinuteKey) return;

    if (activeNow.length > 0) {
      const matchingActiveCities = activeNow.filter((city) => {
        if (notificationPrefs.scope === 'worldwide') return true;
        if (notificationPrefs.scope === 'local_only') {
          return city.timeZone === userTimeZone;
        }
        if (notificationPrefs.scope === 'favorites') {
          return favoriteCityIds.includes(city.id);
        }
        return false;
      });

      if (matchingActiveCities.length > 0) {
        lastNotifiedMinuteRef.current = currentMinuteKey;
        const userTimeStr = formatCurrentTzTime(currentTime, userTimeZone);

        if (notificationPrefs.soundEnabled) {
          if (trackerMode === '420') {
            synthesizeChillTone();
          } else {
            playChimeSound();
          }
        }

        // Send a single combined notification for the occurrence
        send1111Notification(matchingActiveCities, 'AM', userTimeStr, trackerMode);
      }
    }
  }, [activeNow, notificationPrefs, userTimeZone, favoriteCityIds, currentTime, trackerMode]);

  const handleOpenWishModalForCity = (cityName?: string) => {
    setWishCityContext(cityName || primary.city.name);
    setIsWishModalOpen(true);
  };

  const vancouverTimeStr = formatCurrentTzTime(currentTime, 'America/Vancouver');
  const utcTimeStr = formatCurrentTzTime(currentTime, 'UTC');
  const userNextCountdown = formatCountdownHuman(userLocalNext.remainingMs);

  const is420 = trackerMode === '420';

  // If user opened the World Directory page
  if (currentView === 'world') {
    return (
      <>
        <WorldDirectoryView
          cities={WORLD_CITIES}
          currentTime={currentTime}
          userTimeZone={userTimeZone}
          favoriteIds={favoriteCityIds}
          onToggleFavorite={handleToggleFavorite}
          onSelectCityForWish={(cityName) => handleOpenWishModalForCity(cityName)}
          onBack={() => setCurrentView('dashboard')}
          initialMode={trackerMode}
        />
        <MakeAWishModal
          isOpen={isWishModalOpen}
          onClose={() => setIsWishModalOpen(false)}
          currentCityName={wishCityContext}
          wishes={wishes}
          onAddWish={handleAddWish}
          onDeleteWish={handleDeleteWish}
        />
        <NotificationModal
          isOpen={isNotificationModalOpen}
          onClose={() => setIsNotificationModalOpen(false)}
          prefs={notificationPrefs}
          onUpdatePrefs={handleUpdateNotificationPrefs}
          currentNextCity={primary.city}
          activeMode={trackerMode}
        />
      </>
    );
  }

  // If user opened the full screen map view
  if (currentView === 'map') {
    return (
      <FullScreenMapView
        nextEvent={primary}
        activeNow={activeNow}
        userCityNext={userLocalNext}
        userTimeZone={userTimeZone}
        onBack={() => setCurrentView('dashboard')}
        onSelectCity={(cityName) => {
          handleOpenWishModalForCity(cityName);
        }}
        mode={trackerMode}
      />
    );
  }

  return (
    <div
      className={`min-h-screen bg-neutral-950 text-neutral-100 flex flex-col ${
        is420
          ? 'selection:bg-emerald-500/30 selection:text-emerald-200'
          : 'selection:bg-amber-500/30 selection:text-amber-200'
      }`}
    >
      {/* Top Header */}
      <Header
        userTimeZone={userTimeZone}
        onSelectTimeZone={setUserTimeZone}
        notificationPrefs={notificationPrefs}
        onOpenNotifications={() => setIsNotificationModalOpen(true)}
        onOpenWishModal={() => handleOpenWishModalForCity()}
        onOpenWorldDirectory={() => setCurrentView('world')}
        isWishActiveNow={activeNow.length > 0}
        activeCount={activeNow.length}
        mode={trackerMode}
        currentMode={trackerMode}
        onSelectMode={handleSelectMode}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 md:py-8 space-y-6 md:space-y-8">
        {/* Primary Hero Focus: Next Target Moment in the world (with grouped simultaneous cities) */}
        <Next1111Hero
          slot={primarySlot}
          activeNow={activeNow}
          userTimeZone={userTimeZone}
          onOpenWishModal={handleOpenWishModalForCity}
          onOpenWidgetModal={() => setIsWidgetModalOpen(true)}
          mode={trackerMode}
        />

        {/* 2-Column Responsive Row: User Local (Home City), Queued Wishes & World Map Progression */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-4 space-y-6">
            <UserLocalCard
              userLocalNext={userLocalNext}
              userTimeZone={userTimeZone}
              onSelectTimeZone={setUserTimeZone}
              mode={trackerMode}
            />

            {/* Queued Wishes (displayed only when actual wishes are saved & upcoming) */}
            {queuedWishes.length > 0 && (
              <QueuedWishesCard
                wishes={queuedWishes}
                currentTime={currentTime}
                onDeleteWish={handleDeleteWish}
                onOpenWishModal={handleOpenWishModalForCity}
                mode={trackerMode}
              />
            )}
          </div>

          <div className="lg:col-span-8">
            <WorldMapVisualizer
              nextEvent={primary}
              activeNow={activeNow}
              userCityNext={userLocalNext}
              userTimeZone={userTimeZone}
              onOpenFullScreen={() => setCurrentView('map')}
              onSelectCity={(city) => handleOpenWishModalForCity(city.name)}
              mode={trackerMode}
            />
          </div>
        </div>

        {/* 24-Hour World Timeline & Grouped Slots */}
        <WorldTimeline
          groupedUpcoming={groupedUpcoming}
          timeline={upcomingTimeline}
          favoriteIds={favoriteCityIds}
          onToggleFavorite={handleToggleFavorite}
          onSelectCity={(city) => handleOpenWishModalForCity(city.name)}
          onOpenWorldDirectory={() => setCurrentView('world')}
          userTimeZone={userTimeZone}
          mode={trackerMode}
        />
      </main>

      {/* Live Synchronized Bottom Status Bar */}
      <footer className="border-t border-neutral-800 bg-neutral-950/90 backdrop-blur-md py-4 px-4 text-xs text-neutral-400">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-center md:text-left">
          <div className="flex items-center gap-4 flex-wrap justify-center font-mono">
            <span>
              Home clock ({userTimeZone.split('/').pop()?.replace(/_/g, ' ')}):{' '}
              <strong className="text-neutral-100">{vancouverTimeStr}</strong>
            </span>
            <span className="text-neutral-700">•</span>
            <span>
              UTC: <strong className="text-neutral-100">{utcTimeStr}</strong>
            </span>
            <span className="text-neutral-700">•</span>
            <span>
              Your next {is420 ? '4:20' : '11:11'}:{' '}
              <strong className={is420 ? 'text-emerald-400' : 'text-amber-400'}>
                in {userNextCountdown}
              </strong>{' '}
              ({userLocalNext.localTimeFormatted})
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-neutral-500">
            <span>
              Next {is420 ? '4:20' : '11:11'} World Clock • Real-time IANA synchronization
            </span>
            <span>•</span>
            <button
              id="btn-footer-privacy"
              onClick={() => setIsPrivacyModalOpen(true)}
              className={`text-neutral-400 underline underline-offset-2 transition-colors cursor-pointer ${
                is420 ? 'hover:text-emerald-300' : 'hover:text-amber-300'
              }`}
            >
              Privacy Policy
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <MakeAWishModal
        isOpen={isWishModalOpen}
        onClose={() => setIsWishModalOpen(false)}
        currentCityName={wishCityContext}
        wishes={wishes}
        onAddWish={handleAddWish}
        onDeleteWish={handleDeleteWish}
        activeMode={trackerMode}
      />

      <NotificationModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        prefs={notificationPrefs}
        onUpdatePrefs={handleUpdateNotificationPrefs}
        currentNextCity={primary.city}
        activeMode={trackerMode}
        onOpenWidgets={() => setIsWidgetModalOpen(true)}
      />

      {isWidgetModalOpen && (
        <AndroidWidgetShowcase
          nextEvent={primary}
          upcomingList={groupedUpcoming.map((slot) => slot.cities[0])}
          userTimeZone={userTimeZone}
          onClose={() => setIsWidgetModalOpen(false)}
          activeMode={trackerMode}
        />
      )}

      <PrivacyPolicyModal
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
      />
    </div>
  );
}

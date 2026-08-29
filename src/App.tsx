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
import { WORLD_CITIES } from './data/timezones';
import { getNext1111Worldwide, formatCurrentTzTime, formatCountdownHuman, getNext1111ForCity } from './utils/timeEngine';
import {
  loadNotificationPrefs,
  saveNotificationPrefs,
  playChimeSound,
  send1111Notification,
  syncScheduled1111Notifications,
} from './utils/notifications';
import { CityTimeZone, NotificationPreferences, UserWish } from './types';

const STORAGE_KEY_FAVORITES = '1111_favorite_cities';
const STORAGE_KEY_WISHES = '1111_user_wishes';

export default function App() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'map' | 'world'>('dashboard');
  const [userTimeZone, setUserTimeZone] = useState<string>('America/Vancouver');
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
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [wishCityContext, setWishCityContext] = useState<string | undefined>();

  // Track previous notified minute to avoid duplicate alerts within the same minute
  const lastNotifiedMinuteRef = useRef<string>('');

  // Main real-time clock ticker (runs every 1000ms)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Compute real-time 11:11 worldwide calculations
  const {
    primarySlot,
    primary,
    activeNow,
    groupedUpcoming,
    upcomingTimeline,
    userLocalNext,
  } = getNext1111Worldwide(WORLD_CITIES, currentTime, userTimeZone);

  // Compute queued upcoming wishes
  const queuedWishes = useMemo(() => {
    const nowMs = currentTime.getTime();
    return wishes.filter((wish) => {
      // If wish has targetTimestamp, check if it's in the future or active now (within 60s past)
      if (wish.targetTimestamp) {
        return wish.targetTimestamp >= nowMs - 60000;
      }
      // If legacy wish without targetTimestamp, dynamically calculate next 11:11
      const city = WORLD_CITIES.find(
        (c) => c.name.toLowerCase() === (wish.cityName || '').toLowerCase()
      );
      if (city) {
        const nextEv = getNext1111ForCity(city, currentTime);
        return nextEv.remainingMs >= -60000;
      }
      return true;
    }).map((wish) => {
      if (!wish.targetTimestamp) {
        const city = WORLD_CITIES.find(
          (c) => c.name.toLowerCase() === (wish.cityName || '').toLowerCase()
        );
        const targetMs = city
          ? getNext1111ForCity(city, currentTime).targetDate.getTime()
          : getNext1111Worldwide(WORLD_CITIES, currentTime).primary.targetDate.getTime();
        return { ...wish, targetTimestamp: targetMs };
      }
      return wish;
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

  // Check and dispatch automatic 11:11 notifications (strictly 1 notification per occurrence)
  useEffect(() => {
    if (!notificationPrefs.enabled) return;

    const currentMinuteKey = `${new Date().getUTCHours()}:${new Date().getUTCMinutes()}`;
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
          playChimeSound();
        }

        // Send a single combined notification for the occurrence
        send1111Notification(matchingActiveCities, 'AM', userTimeStr);
      }
    }
  }, [activeNow, notificationPrefs, userTimeZone, favoriteCityIds, currentTime]);

  const handleOpenWishModalForCity = (cityName?: string) => {
    setWishCityContext(cityName || primary.city.name);
    setIsWishModalOpen(true);
  };

  const vancouverTimeStr = formatCurrentTzTime(currentTime, 'America/Vancouver');
  const utcTimeStr = formatCurrentTzTime(currentTime, 'UTC');
  const vancouverNextCountdown = formatCountdownHuman(userLocalNext.remainingMs);

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
        />
        <MakeAWishModal
          isOpen={isWishModalOpen}
          onClose={() => setIsWishModalOpen(false)}
          currentCityName={wishCityContext}
        />
        <NotificationModal
          isOpen={isNotificationModalOpen}
          onClose={() => setIsNotificationModalOpen(false)}
          prefs={notificationPrefs}
          onUpdatePrefs={handleUpdateNotificationPrefs}
          currentNextCity={primary.city}
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
      />
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col selection:bg-amber-500/30 selection:text-amber-200">
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
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 md:py-8 space-y-6 md:space-y-8">
        {/* Primary Hero Focus: Next 11:11 in the world (with grouped simultaneous cities) */}
        <Next1111Hero
          slot={primarySlot}
          activeNow={activeNow}
          userTimeZone={userTimeZone}
          onOpenWishModal={handleOpenWishModalForCity}
          onOpenWidgetModal={() => {}}
        />

        {/* 2-Column Responsive Row: User Local (Vancouver), Queued Wishes & World Map Progression */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-4 space-y-6">
            <UserLocalCard
              userLocalNext={userLocalNext}
              userTimeZone={userTimeZone}
              onSelectTimeZone={setUserTimeZone}
            />

            {/* Queued Wishes (displayed only when actual wishes are saved & upcoming) */}
            {queuedWishes.length > 0 && (
              <QueuedWishesCard
                wishes={queuedWishes}
                currentTime={currentTime}
                onDeleteWish={handleDeleteWish}
                onOpenWishModal={handleOpenWishModalForCity}
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
        />
      </main>

      {/* Live Synchronized Bottom Status Bar */}
      <footer className="border-t border-neutral-800 bg-neutral-950/90 backdrop-blur-md py-4 px-4 text-xs text-neutral-400">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-center md:text-left">
          <div className="flex items-center gap-4 flex-wrap justify-center font-mono">
            <span>
              Vancouver now: <strong className="text-neutral-100">{vancouverTimeStr}</strong>
            </span>
            <span className="text-neutral-700">•</span>
            <span>
              UTC: <strong className="text-neutral-100">{utcTimeStr}</strong>
            </span>
            <span className="text-neutral-700">•</span>
            <span>
              Your next Vancouver 11:11: <strong className="text-amber-400">in {vancouverNextCountdown}</strong> ({userLocalNext.localTimeFormatted})
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-neutral-500">
            <span>Next 11:11 World Clock • Real-time IANA synchronization</span>
            <span>•</span>
            <button
              id="btn-footer-privacy"
              onClick={() => setIsPrivacyModalOpen(true)}
              className="text-neutral-400 hover:text-amber-300 underline underline-offset-2 transition-colors cursor-pointer"
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
      />

      <NotificationModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        prefs={notificationPrefs}
        onUpdatePrefs={handleUpdateNotificationPrefs}
        currentNextCity={primary.city}
      />

      <PrivacyPolicyModal
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
      />
    </div>
  );
}

import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Search,
  Star,
  Globe,
  Clock,
  Sparkles,
  ArrowUpDown,
} from 'lucide-react';
import { CityTimeZone, TrackerMode } from '../types';
import {
  getNextTargetForCity,
  formatCountdownHuman,
  formatCurrentTzTime12,
  formatCurrentTzTime,
} from '../utils/timeEngine';

interface WorldDirectoryViewProps {
  cities: CityTimeZone[];
  currentTime: Date;
  userTimeZone: string;
  favoriteIds: string[];
  onToggleFavorite: (cityId: string) => void;
  onSelectCityForWish: (cityName: string) => void;
  onBack: () => void;
  initialMode?: TrackerMode;
}

type SortOption = 'countdown' | 'name' | 'offset' | 'localTime';

export const WorldDirectoryView: React.FC<WorldDirectoryViewProps> = ({
  cities,
  currentTime,
  userTimeZone,
  favoriteIds,
  onToggleFavorite,
  onSelectCityForWish,
  onBack,
  initialMode = '1111',
}) => {
  const [activeMode, setActiveMode] = useState<TrackerMode>(initialMode);
  const is420 = activeMode === '420';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('All');
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('countdown');
  const [timeFormat, setTimeFormat] = useState<'12h' | '24h'>('12h');

  const regions = ['All', 'Americas', 'Europe', 'Asia', 'Oceania', 'Pacific', 'Africa', 'Antarctica'];

  // Compute live 11:11 or 4:20 status & countdown for all 92 cities
  const cityEvents = useMemo(() => {
    return cities.map((city) => {
      const nextEvent = getNextTargetForCity(city, activeMode, currentTime, userTimeZone);
      const isFav = favoriteIds.includes(city.id);

      // Parse numerical UTC offset for sorting (e.g. "UTC-7" -> -7, "UTC+5:30" -> 5.5)
      let offsetNum = 0;
      if (city.baseOffsetUtc) {
        const cleaned = city.baseOffsetUtc.replace('UTC', '').trim();
        if (cleaned.includes(':')) {
          const [h, m] = cleaned.split(':').map(Number);
          offsetNum = h >= 0 ? h + (m || 0) / 60 : h - (m || 0) / 60;
        } else {
          offsetNum = parseFloat(cleaned) || 0;
        }
      }

      return {
        city,
        nextEvent,
        isFav,
        offsetNum,
        currentClock:
          timeFormat === '12h'
            ? formatCurrentTzTime12(currentTime, city.timeZone)
            : formatCurrentTzTime(currentTime, city.timeZone),
      };
    });
  }, [cities, currentTime, userTimeZone, favoriteIds, timeFormat, activeMode]);

  // Filter & Sort
  const processedCities = useMemo(() => {
    let list = cityEvents.filter(({ city, isFav }) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        city.name.toLowerCase().includes(q) ||
        city.country.toLowerCase().includes(q) ||
        city.timeZone.toLowerCase().includes(q) ||
        city.baseOffsetUtc.toLowerCase().includes(q) ||
        (city.landmark && city.landmark.toLowerCase().includes(q));

      const matchesRegion = selectedRegion === 'All' || city.region === selectedRegion;
      const matchesFav = !showOnlyFavorites || isFav;

      return matchesSearch && matchesRegion && matchesFav;
    });

    list.sort((a, b) => {
      if (sortBy === 'countdown') {
        return a.nextEvent.remainingMs - b.nextEvent.remainingMs;
      }
      if (sortBy === 'name') {
        return a.city.name.localeCompare(b.city.name);
      }
      if (sortBy === 'offset') {
        return a.offsetNum - b.offsetNum;
      }
      if (sortBy === 'localTime') {
        return a.currentClock.localeCompare(b.currentClock);
      }
      return 0;
    });

    return list;
  }, [cityEvents, searchQuery, selectedRegion, showOnlyFavorites, sortBy]);

  const activeCount = cityEvents.filter((c) => c.nextEvent.isCurrentActive).length;
  const nextUpCity = [...cityEvents].sort((a, b) => a.nextEvent.remainingMs - b.nextEvent.remainingMs)[0];

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-neutral-950/90 border-b border-neutral-800/80 px-4 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-3">
            <button
              id="btn-world-back"
              onClick={onBack}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 text-xs font-semibold transition-all cursor-pointer shadow-sm hover:text-white"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>

            <div className="h-5 w-px bg-neutral-800 hidden sm:block" />

            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-xl border flex items-center justify-center ${
                  is420
                    ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                    : 'bg-amber-500/20 border-amber-500/30 text-amber-400'
                }`}
              >
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <h1 className="font-display font-bold text-base md:text-lg text-white leading-tight">
                  World Cities Directory
                </h1>
                <p className="text-[11px] text-neutral-400">
                  Tracking {cities.length} global locations for {is420 ? '4:20' : '11:11'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Mode Switcher Tabs */}
            <div className="inline-flex rounded-xl bg-neutral-900 border border-neutral-800 p-0.5 text-xs font-semibold">
              <button
                id="world-dir-mode-1111"
                onClick={() => setActiveMode('1111')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                  !is420
                    ? 'bg-amber-400 text-neutral-950 font-bold shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <span>✨</span>
                <span>11:11</span>
              </button>
              <button
                id="world-dir-mode-420"
                onClick={() => setActiveMode('420')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                  is420
                    ? 'bg-emerald-400 text-neutral-950 font-bold shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <span>🌿</span>
                <span>4:20</span>
              </button>
            </div>

            {/* 12h / 24h toggle */}
            <div className="inline-flex rounded-xl bg-neutral-900 border border-neutral-800 p-0.5 text-[11px] font-mono">
              <button
                onClick={() => setTimeFormat('12h')}
                className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                  timeFormat === '12h'
                    ? is420
                      ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                12h
              </button>
              <button
                onClick={() => setTimeFormat('24h')}
                className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                  timeFormat === '24h'
                    ? is420
                      ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                24h
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 md:py-8 space-y-6">
        {/* Quick Stats Overview Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800/90 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-neutral-400 font-medium">Total Cities Tracked</div>
              <div className="text-xl font-bold font-display text-white mt-0.5">
                {cities.length} Locations
              </div>
            </div>
            <div
              className={`w-10 h-10 rounded-xl bg-neutral-800/80 border border-neutral-700/60 flex items-center justify-center ${
                is420 ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              <Globe className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800/90 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-neutral-400 font-medium">
                Active {is420 ? '4:20' : '11:11'} Right Now
              </div>
              <div className="text-xl font-bold font-display text-emerald-400 mt-0.5 flex items-center gap-2">
                <span>
                  {activeCount} {activeCount === 1 ? 'City' : 'Cities'}
                </span>
                {activeCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                )}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800/90 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-neutral-400 font-medium">
                Next Global {is420 ? '4:20' : '11:11'}
              </div>
              <div
                className={`text-sm font-bold font-mono mt-0.5 truncate ${
                  is420 ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {nextUpCity?.city.name} (in{' '}
                {formatCountdownHuman(nextUpCity?.nextEvent.remainingMs || 0)})
              </div>
            </div>
            <div
              className={`w-10 h-10 rounded-xl border flex items-center justify-center ${
                is420
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                  : 'bg-amber-500/15 border-amber-500/30 text-amber-400'
              }`}
            >
              <Clock className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Filter, Search & Controls */}
        <div className="p-4 md:p-5 rounded-2xl bg-neutral-900/90 border border-neutral-800 shadow-xl space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            {/* Search Box */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="input-world-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by city, country, time zone (e.g. Tokyo, America/Vancouver, UTC-7)..."
                className={`w-full pl-9 pr-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-100 text-xs placeholder:text-neutral-500 focus:outline-none transition-colors ${
                  is420 ? 'focus:border-emerald-500/60' : 'focus:border-amber-500/60'
                }`}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 text-xs cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Sort Control */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-neutral-400 shrink-0">
                <ArrowUpDown className="w-3.5 h-3.5 text-neutral-500" />
                <span>Sort:</span>
              </div>
              <select
                id="select-world-sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className={`bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-200 focus:outline-none transition-colors cursor-pointer ${
                  is420 ? 'focus:border-emerald-500/60' : 'focus:border-amber-500/60'
                }`}
              >
                <option value="countdown">Next {is420 ? '4:20' : '11:11'} (Soonest First)</option>
                <option value="name">City Name (A to Z)</option>
                <option value="offset">Time Zone Offset (West to East)</option>
                <option value="localTime">Current Clock Time</option>
              </select>
            </div>

            {/* Favorites Filter */}
            <button
              id="btn-world-favorites-filter"
              onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
              className={`flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                showOnlyFavorites
                  ? is420
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-neutral-200'
              }`}
            >
              <Star
                className={`w-3.5 h-3.5 ${
                  showOnlyFavorites
                    ? is420
                      ? 'fill-emerald-400 text-emerald-400'
                      : 'fill-amber-400 text-amber-400'
                    : ''
                }`}
              />
              <span>Favorites ({favoriteIds.length})</span>
            </button>
          </div>

          {/* Region Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-t border-neutral-800/80 pt-3">
            {regions.map((region) => {
              const count =
                region === 'All'
                  ? cities.length
                  : cities.filter((c) => c.region === region).length;

              return (
                <button
                  key={region}
                  onClick={() => setSelectedRegion(region)}
                  className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap transition-all border cursor-pointer ${
                    selectedRegion === region
                      ? is420
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                      : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-neutral-200'
                  }`}
                >
                  {region} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Showing Count */}
        <div className="flex items-center justify-between text-xs text-neutral-400 px-1">
          <span>
            Showing <strong className="text-white">{processedCities.length}</strong> of {cities.length} cities
          </span>
          {showOnlyFavorites && (
            <span className={`${is420 ? 'text-emerald-400' : 'text-amber-400'} font-medium`}>
              Filtered to Starred Favorites
            </span>
          )}
        </div>

        {/* Directory Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
          {processedCities.map(({ city, nextEvent, isFav, currentClock }) => {
            const countdownStr = formatCountdownHuman(nextEvent.remainingMs);

            return (
              <div
                key={city.id}
                className={`p-4 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between gap-3 group ${
                  nextEvent.isCurrentActive
                    ? is420
                      ? 'bg-gradient-to-br from-emerald-500/15 via-neutral-900 to-neutral-900 border-emerald-400/60 shadow-lg shadow-emerald-500/10'
                      : 'bg-gradient-to-br from-amber-500/15 via-neutral-900 to-neutral-900 border-amber-400/60 shadow-lg shadow-amber-500/10'
                    : 'bg-neutral-900/80 border-neutral-800/90 hover:border-neutral-700 hover:bg-neutral-900'
                }`}
              >
                {/* Active glowing pulse bar */}
                {nextEvent.isCurrentActive && (
                  <div
                    className={`absolute top-0 left-0 right-0 h-1 animate-pulse ${
                      is420
                        ? 'bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400'
                        : 'bg-gradient-to-r from-amber-400 via-yellow-300 to-emerald-400'
                    }`}
                  />
                )}

                {/* Header row: Flag, Name, UTC offset, Favorite */}
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-3xl shrink-0 p-1 rounded-xl bg-neutral-950/60 border border-neutral-800/80">
                      {city.flag}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-sm sm:text-base text-white truncate">
                          {city.name}
                        </span>
                        <span className="text-[10px] font-mono text-sky-400 px-1.5 py-0.5 rounded bg-neutral-950 border border-neutral-800 font-semibold shrink-0">
                          {city.baseOffsetUtc}
                        </span>
                        {nextEvent.isCurrentActive && (
                          <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30 animate-pulse">
                            ACTIVE {is420 ? '4:20' : '11:11'}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-neutral-400 truncate mt-0.5">
                        {city.country} • {city.landmark || city.region}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onToggleFavorite(city.id)}
                    className={`p-2 rounded-xl text-neutral-500 hover:bg-neutral-800 transition-colors shrink-0 cursor-pointer ${
                      is420 ? 'hover:text-emerald-400' : 'hover:text-amber-400'
                    }`}
                    title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <Star
                      className={`w-4 h-4 ${
                        isFav
                          ? is420
                            ? 'fill-emerald-400 text-emerald-400'
                            : 'fill-amber-400 text-amber-400'
                          : ''
                      }`}
                    />
                  </button>
                </div>

                {/* Middle Info: Time Zone & Current Live Clock */}
                <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-neutral-950/70 border border-neutral-850 text-xs">
                  <div>
                    <div className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">
                      Time Zone
                    </div>
                    <div className="font-mono text-neutral-300 truncate mt-0.5 text-[11px]" title={city.timeZone}>
                      {city.timeZone}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">
                      Current Time
                    </div>
                    <div className="font-mono text-neutral-100 font-semibold mt-0.5 text-[12px] flex items-center gap-1">
                      <Clock
                        className={`w-3 h-3 ${is420 ? 'text-emerald-400/80' : 'text-amber-400/80'}`}
                      />
                      <span>{currentClock}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Row: Next countdown & Action */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-neutral-800/60">
                  <div>
                    <div className="text-[10px] text-neutral-400">
                      Next {nextEvent.localTimeFormatted}:
                    </div>
                    <div
                      className={`font-mono font-bold text-sm ${
                        is420 ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      in {countdownStr}
                    </div>
                  </div>

                  <button
                    onClick={() => onSelectCityForWish(city.name)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      is420
                        ? 'bg-neutral-800 hover:bg-emerald-500/20 text-neutral-300 hover:text-emerald-300 border-neutral-700 hover:border-emerald-500/30'
                        : 'bg-neutral-800 hover:bg-amber-500/20 text-neutral-300 hover:text-amber-300 border-neutral-700 hover:border-amber-500/30'
                    }`}
                    title={is420 ? `Catch 4:20 vibe in ${city.name}` : `Make a wish for ${city.name}`}
                  >
                    <Sparkles
                      className={`w-3.5 h-3.5 ${is420 ? 'text-emerald-400' : 'text-amber-400'}`}
                    />
                    <span>{is420 ? '4:20 Vibe' : 'Wish'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty Search State */}
        {processedCities.length === 0 && (
          <div className="text-center py-16 px-4 rounded-3xl bg-neutral-900/50 border border-neutral-800 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-neutral-800 text-neutral-400 mx-auto flex items-center justify-center">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-white">No cities match your filter</h3>
            <p className="text-xs text-neutral-400 max-w-sm mx-auto">
              Try searching for a different city name, country, or clear your search and favorite filters.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedRegion('All');
                setShowOnlyFavorites(false);
              }}
              className={`px-4 py-2 rounded-xl text-neutral-950 text-xs font-bold transition-all shadow-sm cursor-pointer ${
                is420
                  ? 'bg-emerald-400 hover:bg-emerald-300'
                  : 'bg-amber-400 hover:bg-amber-300'
              }`}
            >
              Reset All Filters
            </button>
          </div>
        )}
      </main>
    </div>
  );
};


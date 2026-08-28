import React, { useState, useMemo } from 'react';
import { Search, Star, Clock, Globe, Filter, Sparkles, Layers } from 'lucide-react';
import { Grouped1111Slot, Next1111Event, CityTimeZone } from '../types';
import { formatCountdownHuman } from '../utils/timeEngine';

interface WorldTimelineProps {
  groupedUpcoming: Grouped1111Slot[];
  timeline: Next1111Event[];
  favoriteIds: string[];
  onToggleFavorite: (cityId: string) => void;
  onSelectCity: (city: CityTimeZone) => void;
  onOpenWorldDirectory?: () => void;
  userTimeZone: string;
}

export const WorldTimeline: React.FC<WorldTimelineProps> = ({
  groupedUpcoming,
  timeline,
  favoriteIds,
  onToggleFavorite,
  onSelectCity,
  onOpenWorldDirectory,
  userTimeZone,
}) => {
  const [viewMode, setViewMode] = useState<'grouped' | 'individual'>('grouped');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('All');
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

  const regions = ['All', 'Americas', 'Europe', 'Asia', 'Oceania', 'Pacific', 'Africa'];

  const filteredTimeline = useMemo(() => {
    return timeline.filter((event) => {
      const matchesSearch =
        event.city.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.city.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.city.timeZone.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRegion =
        selectedRegion === 'All' || event.city.region === selectedRegion;

      const matchesFavorite = !showOnlyFavorites || favoriteIds.includes(event.city.id);

      return matchesSearch && matchesRegion && matchesFavorite;
    });
  }, [timeline, searchQuery, selectedRegion, showOnlyFavorites, favoriteIds]);

  return (
    <div className="rounded-3xl bg-neutral-900/90 border border-neutral-800 p-5 md:p-6 backdrop-blur-md shadow-xl space-y-5">
      {/* Header & Mode Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
        <div>
          <div className="text-[11px] font-bold tracking-[0.2em] text-neutral-400 uppercase">
            UP NEXT AROUND THE WORLD
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Scanning {timeline.length} cities for the next moment it reads 11:11 (AM or PM).
          </p>
        </div>

        {/* View mode toggle & Show World full page button */}
        <div className="flex items-center gap-2 flex-wrap">
          {onOpenWorldDirectory && (
            <button
              onClick={onOpenWorldDirectory}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-950 hover:bg-neutral-850 border border-neutral-800 hover:border-neutral-700 text-xs font-semibold text-neutral-300 hover:text-white transition-all cursor-pointer shadow-sm"
              title="Open full-screen world directory with live clocks and time zones"
            >
              <Globe className="w-3.5 h-3.5 text-amber-400" />
              <span>Show World</span>
            </button>
          )}

          <div className="inline-flex rounded-xl bg-neutral-950 p-1 border border-neutral-800 text-xs">
            <button
              onClick={() => setViewMode('grouped')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                viewMode === 'grouped'
                  ? 'bg-amber-500 text-neutral-950 font-bold shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Grouped Moments ({groupedUpcoming.length})
            </button>
            <button
              onClick={() => setViewMode('individual')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                viewMode === 'individual'
                  ? 'bg-amber-500 text-neutral-950 font-bold shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              All {timeline.length} Cities
            </button>
          </div>
        </div>
      </div>

      {/* GROUPED VIEW (Matching exact custom calculator screenshot) */}
      {viewMode === 'grouped' && (
        <div className="divide-y divide-neutral-800/80">
          {groupedUpcoming.slice(1).map((slot, index) => {
            const countdownStr = formatCountdownHuman(slot.remainingMs);
            return (
              <div
                key={slot.id || index}
                className="py-4 hover:bg-neutral-850/40 px-2 sm:px-3 rounded-2xl transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
              >
                <div className="space-y-1 max-w-xl">
                  <div className="font-semibold text-sm sm:text-base text-white leading-snug">
                    {slot.cityNames.join(', ')}
                  </div>
                  <div className="text-xs text-neutral-400 flex items-center gap-2 flex-wrap font-mono">
                    <span>{slot.primaryTz}</span>
                    <span className="text-neutral-600">•</span>
                    <span>{slot.gmtOffsetFormatted}</span>
                    <span className="text-neutral-600">•</span>
                    <span>local now {slot.clockNowFormatted}</span>
                  </div>
                </div>

                <div className="text-left sm:text-right flex-shrink-0">
                  <div className="font-display font-bold text-sm sm:text-base text-amber-400">
                    in {countdownStr}
                  </div>
                  <div className="text-xs text-neutral-400">
                    {slot.localPeriodFormatted}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* INDIVIDUAL CITIES VIEW (Searchable / Filterable / Favorites) */}
      {viewMode === 'individual' && (
        <div className="space-y-4">
          {/* Search & Region Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search city, country, or timezone..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-100 text-xs placeholder:text-neutral-500 focus:outline-none focus:border-amber-500/60 transition-colors"
              />
            </div>

            {/* Favorites filter toggle */}
            <button
              onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                showOnlyFavorites
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                  : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-neutral-200'
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${showOnlyFavorites ? 'fill-amber-400 text-amber-400' : ''}`} />
              <span>Favorites ({favoriteIds.length})</span>
            </button>
          </div>

          {/* Region Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {regions.map((region) => (
              <button
                key={region}
                onClick={() => setSelectedRegion(region)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all border ${
                  selectedRegion === region
                    ? 'bg-neutral-800 text-white border-neutral-600 font-semibold'
                    : 'bg-neutral-950 text-neutral-400 border-neutral-850 hover:text-neutral-200'
                }`}
              >
                {region}
              </button>
            ))}
          </div>

          {/* Individual City Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-[460px] overflow-y-auto pr-1">
            {filteredTimeline.map((event) => {
              const isFav = favoriteIds.includes(event.city.id);
              const countdownStr = formatCountdownHuman(event.remainingMs);

              return (
                <div
                  key={event.city.id}
                  onClick={() => onSelectCity(event.city)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    event.isCurrentActive
                      ? 'bg-amber-500/15 border-amber-400/50 shadow-md shadow-amber-500/10'
                      : 'bg-neutral-950/60 border-neutral-800/80 hover:border-neutral-700 hover:bg-neutral-950'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-2xl">{event.city.flag}</span>
                    <div className="min-w-0">
                      <div className="font-semibold text-xs sm:text-sm text-white truncate flex items-center gap-1.5">
                        {event.city.name}
                        {event.isCurrentActive && (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold animate-pulse">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-neutral-400 truncate">
                        {event.city.country} • {event.city.timeZone}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 flex-shrink-0">
                    <div className="text-right">
                      <div className="font-mono text-xs font-bold text-amber-400">
                        {countdownStr}
                      </div>
                      <div className="text-[10px] text-neutral-400">
                        {event.localTimeFormatted}
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(event.city.id);
                      }}
                      className="p-1.5 rounded-lg text-neutral-500 hover:text-amber-400 transition-colors"
                      title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-amber-400 text-amber-400' : ''}`} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

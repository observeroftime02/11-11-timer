import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import {
  ArrowLeft,
  Sparkles,
  Layers,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Navigation,
  Globe,
  Clock,
  MapPin,
  Compass,
  Info,
  X,
} from 'lucide-react';
import { NextMomentEvent, CityTimeZone, TrackerMode } from '../types';
import { WORLD_CITIES } from '../data/timezones';
import { formatCurrentTzTime, getNextTargetForCity, formatCountdownHuman } from '../utils/timeEngine';

interface FullScreenMapViewProps {
  nextEvent: NextMomentEvent;
  activeNow: CityTimeZone[];
  userCityNext: NextMomentEvent;
  userTimeZone: string;
  onBack: () => void;
  onSelectCity: (cityName: string) => void;
  mode?: TrackerMode;
}

const DARK_TILE_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}';
const TILE_ATTRIBUTION = 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ';

export const FullScreenMapView: React.FC<FullScreenMapViewProps> = ({
  nextEvent,
  activeNow,
  userCityNext,
  userTimeZone,
  onBack,
  onSelectCity,
  mode = '1111',
}) => {
  const is420 = mode === '420';
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  const [showTimezones, setShowTimezones] = useState(true);
  const [selectedTzOffset, setSelectedTzOffset] = useState<number | null>(null);
  const [selectedCity, setSelectedCity] = useState<CityTimeZone>(nextEvent.city);

  const tzLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const tzPolygonsRef = useRef<Map<number, L.Polygon>>(new Map());

  // Create custom marker icons
  const createCityIcon = (city: CityTimeZone, isNext: boolean, isHome: boolean, isActive: boolean, isSelected: boolean) => {
    if (isActive) {
      return L.divIcon({
        className: 'leaflet-custom-marker',
        html: `
          <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2 cursor-pointer">
            <span class="absolute w-9 h-9 rounded-full bg-emerald-400/40 animate-ping"></span>
            <span class="w-6 h-6 rounded-full bg-emerald-400 border-2 border-neutral-950 shadow-xl flex items-center justify-center text-xs">${is420 ? '🌿' : '✨'}</span>
          </div>
        `,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });
    }

    if (isNext) {
      return L.divIcon({
        className: 'leaflet-custom-marker',
        html: `
          <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2 cursor-pointer">
            <span class="absolute w-10 h-10 rounded-full ${is420 ? 'bg-emerald-400/40' : 'bg-amber-400/40'} animate-ping"></span>
            <span class="w-7 h-7 rounded-full ${is420 ? 'bg-emerald-400 text-neutral-950' : 'bg-amber-400 text-neutral-950'} border-2 border-neutral-950 shadow-2xl flex items-center justify-center text-sm font-bold">${is420 ? '🌿' : '✨'}</span>
          </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });
    }

    if (isHome) {
      return L.divIcon({
        className: 'leaflet-custom-marker',
        html: `
          <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2 cursor-pointer">
            <span class="w-6 h-6 rounded-full bg-indigo-500 border-2 border-white shadow-xl flex items-center justify-center text-xs">🏠</span>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });
    }

    if (isSelected) {
      return L.divIcon({
        className: 'leaflet-custom-marker',
        html: `
          <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2 cursor-pointer">
            <span class="w-5 h-5 rounded-full bg-sky-400 border-2 border-white shadow-xl animate-bounce"></span>
          </div>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });
    }

    return L.divIcon({
      className: 'leaflet-custom-marker',
      html: `
        <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2 group cursor-pointer p-1">
          <span class="w-3 h-3 rounded-full bg-neutral-300/80 group-hover:${is420 ? 'bg-emerald-300' : 'bg-amber-300'} border border-neutral-900 shadow-sm transition-transform group-hover:scale-150"></span>
        </div>
      `,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const initialLat = nextEvent.city.lat || 20;
    const initialLng = nextEvent.city.lng || 0;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 2.75,
      minZoom: 1.5,
      maxZoom: 9,
      zoomControl: false,
      attributionControl: true,
      worldCopyJump: true,
    });

    // Dark Map Tiles
    L.tileLayer(DARK_TILE_URL, {
      maxZoom: 16,
      attribution: TILE_ATTRIBUTION,
    }).addTo(map);

    // Build Time Zone Columns Layer
    const tzGroup = L.layerGroup();
    tzPolygonsRef.current.clear();

    for (let i = -12; i <= 12; i++) {
      const lng = i * 15;
      const isUtcZero = i === 0;
      const label = isUtcZero ? 'UTC 0' : i > 0 ? `UTC+${i}` : `UTC${i}`;

      if (i < 12) {
        const polygon = L.polygon(
          [
            [-85, lng],
            [85, lng],
            [85, lng + 15],
            [-85, lng + 15],
          ],
          {
            color: isUtcZero ? '#38bdf8' : '#475569',
            weight: isUtcZero ? 1.5 : 0.75,
            dashArray: isUtcZero ? undefined : '4, 6',
            opacity: isUtcZero ? 0.8 : 0.4,
            fillColor: isUtcZero ? '#0284c7' : '#334155',
            fillOpacity: 0.08,
          }
        );

        polygon.on('click', () => {
          setSelectedTzOffset(i);
        });

        tzPolygonsRef.current.set(i, polygon);
        tzGroup.addLayer(polygon);
      }

      const labelMarker = L.marker([0, lng + 7.5], {
        icon: L.divIcon({
          className: 'tz-label-icon',
          html: `<div style="color: ${isUtcZero ? '#38bdf8' : '#94a3b8'}; font-size: 10px; font-family: monospace; font-weight: bold; text-shadow: 0 1px 3px rgba(0,0,0,0.9); white-space: nowrap; cursor: pointer;">${label}</div>`,
          iconAnchor: [18, 8],
        }),
      });

      labelMarker.on('click', () => {
        setSelectedTzOffset(i);
      });

      tzGroup.addLayer(labelMarker);
    }

    // Active Golden 11:11 or Emerald 4:20 Wave
    const targetLng = nextEvent.city.lng;
    const waveLine = L.polyline(
      [
        [-85, targetLng],
        [85, targetLng],
      ],
      {
        color: is420 ? '#10b981' : '#f59e0b',
        weight: 3,
        dashArray: '6, 6',
        opacity: 0.95,
      }
    );
    tzGroup.addLayer(waveLine);

    tzGroup.addTo(map);
    tzLayerGroupRef.current = tzGroup;

    // Build City Markers
    const markersGroup = L.layerGroup();

    WORLD_CITIES.forEach((city) => {
      const isNext = city.id === nextEvent.city.id;
      const isHome = city.timeZone === userTimeZone;
      const isActive = activeNow.some((c) => c.id === city.id);
      const isSelected = selectedCity?.id === city.id;

      const icon = createCityIcon(city, isNext, isHome, isActive, isSelected);
      const marker = L.marker([city.lat, city.lng], {
        icon,
        zIndexOffset: isNext ? 1000 : isActive ? 900 : isHome ? 800 : 10,
      });

      marker.on('click', () => {
        setSelectedCity(city);
        map.flyTo([city.lat, city.lng], Math.max(map.getZoom(), 4), { duration: 0.8 });
      });

      markersGroup.addLayer(marker);
    });

    markersGroup.addTo(map);
    mapInstanceRef.current = map;

    setTimeout(() => {
      map.invalidateSize();
    }, 150);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [is420]);

  // Update Time Zone visual highlighting
  useEffect(() => {
    tzPolygonsRef.current.forEach((polygon, offset) => {
      const isHighlighted = selectedTzOffset === offset;
      polygon.setStyle({
        fillColor: isHighlighted ? (is420 ? '#10b981' : '#f59e0b') : offset === 0 ? '#0284c7' : '#334155',
        fillOpacity: isHighlighted ? 0.28 : 0.08,
        color: isHighlighted ? (is420 ? '#10b981' : '#f59e0b') : offset === 0 ? '#38bdf8' : '#475569',
        weight: isHighlighted ? 2.5 : offset === 0 ? 1.5 : 0.75,
      });
    });
  }, [selectedTzOffset, is420]);

  // Toggle Timezones Layer
  useEffect(() => {
    if (!mapInstanceRef.current || !tzLayerGroupRef.current) return;
    if (showTimezones) {
      mapInstanceRef.current.addLayer(tzLayerGroupRef.current);
    } else {
      mapInstanceRef.current.removeLayer(tzLayerGroupRef.current);
    }
  }, [showTimezones]);

  // Camera Helpers
  const flyToCoords = (lat: number, lng: number, zoom: number = 4) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([lat, lng], zoom, { duration: 1 });
    }
  };

  const handleZoom = (delta: number) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setZoom(mapInstanceRef.current.getZoom() + delta);
    }
  };

  const resetView = () => {
    setSelectedTzOffset(null);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([20, 0], 2.25, { duration: 1 });
    }
  };

  const citiesInSelectedTz = selectedTzOffset !== null
    ? WORLD_CITIES.filter((c) => {
        const offsetNum = parseInt(c.baseOffsetUtc.replace('UTC', '').replace('+', '') || '0', 10);
        return offsetNum === selectedTzOffset;
      })
    : [];

  const selectedEvent = selectedCity ? getNextTargetForCity(selectedCity, (mode || '1111') as TrackerMode, new Date(), userTimeZone) : null;
  const selectedLocalTime = selectedCity ? formatCurrentTzTime(new Date(), selectedCity.timeZone) : null;

  return (
    <div className="fixed inset-0 z-50 bg-[#070c18] flex flex-col text-neutral-100 animate-fade-in select-none">
      {/* Top Header Bar */}
      <header className="px-4 py-3 bg-neutral-900/95 border-b border-neutral-800 flex items-center justify-between gap-3 z-20 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            id="btn-back-from-map"
            onClick={onBack}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs transition-colors cursor-pointer border border-neutral-700 active:scale-95 shadow-md"
          >
            <ArrowLeft className={`w-4 h-4 ${is420 ? 'text-emerald-400' : 'text-amber-400'}`} />
            <span>← Back to Dashboard</span>
          </button>

          <div>
            <h1 className="font-display font-bold text-sm sm:text-base text-white flex items-center gap-2">
              <span>Worldwide {is420 ? '4:20' : '11:11'} Map</span>
            </h1>
          </div>
        </div>

        {/* Action Controls Bar */}
        <div className="flex items-center gap-2">
          {/* Fly to Next City */}
          <button
            onClick={() => {
              setSelectedCity(nextEvent.city);
              flyToCoords(nextEvent.city.lat, nextEvent.city.lng, 4.5);
            }}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              is420
                ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/40'
                : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/40'
            }`}
            title={`Jump to Next ${is420 ? '4:20' : '11:11'} City`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Next:</span>
            <span>{nextEvent.city.name}</span>
          </button>

          {/* Fly to Home City */}
          <button
            onClick={() => {
              setSelectedCity(userCityNext.city);
              flyToCoords(userCityNext.city.lat, userCityNext.city.lng, 4.5);
            }}
            className="px-3 py-1.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            title="Jump to Home Location"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Home</span>
          </button>

          {/* Toggle Timezone Grid */}
          <button
            onClick={() => setShowTimezones(!showTimezones)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer ${
              showTimezones
                ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                : 'bg-neutral-800 text-neutral-400 border-neutral-700'
            }`}
            title="Toggle Timezone Meridians"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Time Zones</span>
          </button>

          {/* Zoom Buttons */}
          <div className="flex items-center gap-1 bg-neutral-800 p-1 rounded-xl border border-neutral-700">
            <button
              onClick={() => handleZoom(-1)}
              className="p-1.5 rounded-lg text-neutral-300 hover:bg-neutral-700 cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleZoom(1)}
              className="p-1.5 rounded-lg text-neutral-300 hover:bg-neutral-700 cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={resetView}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-700 cursor-pointer"
              title="Reset World View"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Full-Screen Map Canvas */}
      <main className="relative flex-1 w-full h-full overflow-hidden">
        <div ref={mapContainerRef} className="w-full h-full bg-[#070c18]" />

        {/* Floating Timezone Highlight Banner */}
        {selectedTzOffset !== null && (
          <div
            className={`absolute top-4 left-4 z-[1000] bg-neutral-900/95 border text-neutral-200 text-xs px-3.5 py-2 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-3 ${
              is420 ? 'border-emerald-500/50' : 'border-amber-500/50'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full animate-pulse ${is420 ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              <span className={`font-bold ${is420 ? 'text-emerald-300' : 'text-amber-300'}`}>
                Time Zone UTC{selectedTzOffset >= 0 ? `+${selectedTzOffset}` : selectedTzOffset}
              </span>
            </div>
            <span className="text-neutral-400">({citiesInSelectedTz.length} cities mapped)</span>
            <button
              onClick={() => setSelectedTzOffset(null)}
              className="px-2 py-0.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[11px] font-semibold cursor-pointer"
            >
              Clear
            </button>
          </div>
        )}
      </main>

      {/* Bottom Interactive City & Wish/Vibe Card */}
      <footer className="p-3 sm:p-4 bg-neutral-900 border-t border-neutral-800 z-20">
        {selectedCity && selectedEvent && selectedLocalTime ? (
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{selectedCity.flag}</span>
              <div>
                <div className="font-bold text-sm text-neutral-100 flex items-center gap-2">
                  <span>{selectedCity.name}, {selectedCity.country}</span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-neutral-800 text-sky-400 border border-neutral-700">
                    {selectedCity.baseOffsetUtc}
                  </span>
                  {selectedCity.id === nextEvent.city.id && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${
                        is420
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      }`}
                    >
                      UP NEXT
                    </span>
                  )}
                </div>
                <div className="text-xs text-neutral-400 flex items-center gap-3 mt-0.5 flex-wrap">
                  <span>Current: <strong className="text-white font-mono">{selectedLocalTime}</strong></span>
                  <span>
                    Next {is420 ? '4:20' : '11:11'}:{' '}
                    <strong className={`font-mono ${is420 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      in {formatCountdownHuman(selectedEvent.remainingMs)}
                    </strong>
                  </span>
                  <span className="hidden sm:inline italic text-neutral-500">📍 {selectedCity.landmark}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="btn-make-wish-map-card"
                onClick={() => {
                  onSelectCity(selectedCity.name);
                  onBack();
                }}
                className={`px-4 py-2 rounded-xl text-neutral-950 text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                  is420
                    ? 'bg-emerald-400 hover:bg-emerald-300 shadow-emerald-500/20'
                    : 'bg-amber-400 hover:bg-amber-300 shadow-amber-500/20'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{is420 ? `Vibe for ${selectedCity.name}` : `Wish for ${selectedCity.name}`}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto flex items-center justify-between text-xs text-neutral-400">
            <div className="flex items-center gap-2">
              <Info className={`w-4 h-4 ${is420 ? 'text-emerald-400' : 'text-amber-400'}`} />
              <span>Tap any city or time zone on the map to inspect live time and {is420 ? 'set a 4:20 vibe' : 'make a wish'}.</span>
            </div>
          </div>
        )}
      </footer>
    </div>
  );
};

import React, { useState } from 'react';
import { Download, Sparkles, Check, Image as ImageIcon, Layers } from 'lucide-react';

interface IconOption {
  id: string;
  name: string;
  subtitle: string;
  svgPath: string;
  themeColor: string;
  description: string;
}

const ICONS: IconOption[] = [
  {
    id: 'gold',
    name: 'Material Gold Luxury',
    subtitle: 'Primary / Default Icon',
    svgPath: '/icon-gold.svg',
    themeColor: '#f59e0b',
    description: 'Obsidian squircle with glowing golden 11:11 typography, dial rings, and Earth coordinates.',
  },
  {
    id: 'cosmic',
    name: 'Cosmic Starlight',
    subtitle: 'Midnight Edition',
    svgPath: '/icon-cosmic.svg',
    themeColor: '#818cf8',
    description: 'Deep nebula backdrop with celestial orbital rings and iridescent glowing numerals.',
  },
  {
    id: 'emerald',
    name: 'Material 3 Emerald',
    subtitle: 'Android Dynamic Style',
    svgPath: '/icon-emerald.svg',
    themeColor: '#10b981',
    description: 'Vibrant mint/emerald neon styling inspired by Android 14+ Material You widgets.',
  },
  {
    id: 'minimal',
    name: 'OLED Monolith',
    subtitle: 'Minimalist Clean',
    svgPath: '/icon-minimal.svg',
    themeColor: '#fafafa',
    description: 'High-contrast typography with precision tick marks and glowing amber indicator dot.',
  },
];

interface AppIconStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AppIconStudioModal: React.FC<AppIconStudioModalProps> = ({ isOpen, onClose }) => {
  const [selectedId, setSelectedId] = useState<string>('gold');
  const [downloadingFormat, setDownloadingFormat] = useState<string | null>(null);

  if (!isOpen) return null;

  const selectedIcon = ICONS.find((i) => i.id === selectedId) || ICONS[0];

  const handleDownloadPng = async (icon: IconOption, size = 512) => {
    setDownloadingFormat(`png-${icon.id}`);
    try {
      const response = await fetch(icon.svgPath);
      const svgText = await response.text();

      const img = new Image();
      const svgBlob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
      const blobURL = URL.createObjectURL(svgBlob);

      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, size, size);
          const pngUrl = canvas.toDataURL('image/png');
          const downloadLink = document.createElement('a');
          downloadLink.href = pngUrl;
          downloadLink.download = `1111-world-clock-icon-${icon.id}-${size}x${size}.png`;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
        }
        URL.revokeObjectURL(blobURL);
        setDownloadingFormat(null);
      };
      img.src = blobURL;
    } catch (err) {
      console.error('Error rasterizing SVG to PNG:', err);
      setDownloadingFormat(null);
    }
  };

  const handleDownloadSvg = async (icon: IconOption) => {
    setDownloadingFormat(`svg-${icon.id}`);
    try {
      const response = await fetch(icon.svgPath);
      const svgText = await response.text();
      const blob = new Blob([svgText], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `1111-world-clock-icon-${icon.id}.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setDownloadingFormat(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl bg-neutral-900 border border-neutral-800 p-6 md:p-8 shadow-2xl space-y-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
        >
          ✕
        </button>

        {/* Modal Header */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>App Icon Studio</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold font-display text-white">
            11:11 App Icons & Assets
          </h2>
          <p className="text-xs md:text-sm text-neutral-400">
            Export ready-to-use 512x512 PNGs and vector SVGs for your Android APK, PWABuilder, or home screen launcher.
          </p>
        </div>

        {/* Main Grid of 4 Icon Designs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {ICONS.map((icon) => {
            const isSelected = icon.id === selectedId;
            return (
              <div
                key={icon.id}
                onClick={() => setSelectedId(icon.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-4 ${
                  isSelected
                    ? 'bg-neutral-850 border-amber-500 shadow-lg shadow-amber-500/10'
                    : 'bg-neutral-950/70 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-950'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon Visual Preview */}
                  <div className="w-20 h-20 shrink-0 rounded-2xl overflow-hidden shadow-xl border border-neutral-800 bg-neutral-950 flex items-center justify-center">
                    <img
                      src={icon.svgPath}
                      alt={icon.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-bold text-sm text-white truncate">{icon.name}</h4>
                      {isSelected && (
                        <span className="w-5 h-5 rounded-full bg-amber-500 text-neutral-950 flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] font-medium text-amber-400/90">{icon.subtitle}</div>
                    <p className="text-[11px] text-neutral-400 leading-relaxed">{icon.description}</p>
                  </div>
                </div>

                {/* Direct Download Actions */}
                <div className="flex items-center gap-2 pt-1 border-t border-neutral-800/80">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownloadPng(icon, 512);
                    }}
                    disabled={downloadingFormat === `png-${icon.id}`}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-white text-xs font-semibold flex items-center justify-center gap-1.5 border border-neutral-700 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-400" />
                    <span>512px PNG</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownloadSvg(icon);
                    }}
                    disabled={downloadingFormat === `svg-${icon.id}`}
                    className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 border border-neutral-700 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-neutral-400" />
                    <span>SVG</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Icon Spotlight & Large Export */}
        <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl overflow-hidden border border-neutral-700 shadow-md">
              <img src={selectedIcon.svgPath} alt={selectedIcon.name} className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="text-xs text-neutral-400">Selected for APK export</div>
              <div className="text-sm font-bold text-white">{selectedIcon.name}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => handleDownloadPng(selectedIcon, 512)}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download 512x512 APK Icon
            </button>
            <button
              onClick={() => handleDownloadPng(selectedIcon, 192)}
              className="px-3 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-200 text-xs font-semibold border border-neutral-700 transition-all flex items-center gap-1.5"
              title="Download standard 192px Android icon"
            >
              192px
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

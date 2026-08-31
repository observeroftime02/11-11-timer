import React, { useState } from 'react';
import { Download, Sparkles, Check, Image as ImageIcon, Layers, Layout } from 'lucide-react';

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
    setDownloadingFormat(`png-${icon.id}-${size}`);
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

  const handleDownloadFeatureGraphic = async () => {
    setDownloadingFormat('feature-graphic');
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 500;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Dark obsidian background gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 1024, 500);
      bgGrad.addColorStop(0, '#0a0a0c');
      bgGrad.addColorStop(0.5, '#121218');
      bgGrad.addColorStop(1, '#050507');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 1024, 500);

      // Subtle celestial glow behind icon
      const glowGrad = ctx.createRadialGradient(260, 250, 20, 260, 250, 240);
      glowGrad.addColorStop(0, 'rgba(245, 158, 11, 0.25)');
      glowGrad.addColorStop(0.5, 'rgba(245, 158, 11, 0.06)');
      glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(260, 250, 240, 0, Math.PI * 2);
      ctx.fill();

      // Draw subtle orbital rings on the right
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(750, 250, 180, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(750, 250, 230, 0, Math.PI * 2);
      ctx.stroke();

      // Draw loaded icon on left side (260px square)
      const response = await fetch(selectedIcon.svgPath);
      const svgText = await response.text();
      const img = new Image();
      const svgBlob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
      const blobURL = URL.createObjectURL(svgBlob);

      img.onload = () => {
        // Draw icon
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.6)';
        ctx.shadowBlur = 30;
        ctx.shadowOffsetY = 15;
        ctx.drawImage(img, 140, 130, 240, 240);
        ctx.restore();

        // Right side typography
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 52px system-ui, -apple-system, sans-serif';
        ctx.fillText('Next 11:11', 440, 205);

        // Subtitle pill / badge
        ctx.fillStyle = '#f59e0b';
        ctx.font = '600 22px system-ui, -apple-system, sans-serif';
        ctx.fillText('World Clock & Mindfulness Widgets', 440, 250);

        // Feature bullet tags
        ctx.fillStyle = '#a3a3a3';
        ctx.font = '400 17px system-ui, -apple-system, sans-serif';
        ctx.fillText('✨ Live Global 11:11 & 4:20 Countdowns', 440, 305);
        ctx.fillText('📱 6 Dynamic Android Home Screen Widgets', 440, 340);
        ctx.fillText('🔔 Crystal Harmonic Chimes & Wish Journal', 440, 375);

        // Export PNG
        const pngUrl = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.href = pngUrl;
        downloadLink.download = 'next-1111-feature-graphic-1024x500.png';
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);

        URL.revokeObjectURL(blobURL);
        setDownloadingFormat(null);
      };
      img.src = blobURL;
    } catch (err) {
      console.error('Error generating feature graphic:', err);
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
          className="absolute top-5 right-5 p-2 rounded-xl bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
        >
          ✕
        </button>

        {/* Modal Header */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>App Icon & Play Store Graphics Studio</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold font-display text-white">
            11:11 Store Graphics & App Icons
          </h2>
          <p className="text-xs md:text-sm text-neutral-400">
            Export ready-to-upload 512x512 PNG app icons, 1024x500 feature graphics, and vector SVGs directly for Google Play Store.
          </p>
        </div>

        {/* Feature Graphic Banner Generator Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg shadow-amber-500/5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Layout className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <span>Play Store Feature Graphic</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px]">1024 × 500 px</span>
              </div>
              <div className="text-xs text-neutral-400 mt-0.5">
                Required for Google Play Store main store listing.
              </div>
            </div>
          </div>

          <button
            onClick={handleDownloadFeatureGraphic}
            disabled={downloadingFormat === 'feature-graphic'}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-neutral-950 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>{downloadingFormat === 'feature-graphic' ? 'Generating...' : 'Download 1024x500 Banner'}</span>
          </button>
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
                    disabled={downloadingFormat === `png-${icon.id}-512`}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-white text-xs font-semibold flex items-center justify-center gap-1.5 border border-neutral-700 transition-colors cursor-pointer"
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
                    className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 border border-neutral-700 transition-colors cursor-pointer"
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
              <div className="text-xs text-neutral-400">Selected for Store Icon</div>
              <div className="text-sm font-bold text-white">{selectedIcon.name}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => handleDownloadPng(selectedIcon, 512)}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Download 512x512 Play Store Icon
            </button>
            <button
              onClick={() => handleDownloadPng(selectedIcon, 192)}
              className="px-3 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-200 text-xs font-semibold border border-neutral-700 transition-all flex items-center gap-1.5 cursor-pointer"
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

import React, { useState } from 'react';
import { Megaphone, ChevronRight, X, Sparkles, Bell } from 'lucide-react';
import { Announcement } from '../../types/index.ts';

interface AnnouncementTickerProps {
  announcements?: Announcement[];
  onOpenAnnouncements?: () => void;
}

export const AnnouncementTicker: React.FC<AnnouncementTickerProps> = ({
  announcements = [],
  onOpenAnnouncements,
}) => {
  const [isDismissed, setIsDismissed] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  if (isDismissed || announcements.length === 0) return null;

  const current = announcements[currentIndex] || announcements[0];

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % announcements.length);
  };

  return (
    <div className="bg-indigo-900/90 hover:bg-indigo-900 text-white px-3.5 py-2 rounded-2xl border border-indigo-700/50 shadow-xs flex items-center justify-between gap-3 text-xs transition-colors cursor-pointer group">
      <div
        onClick={onOpenAnnouncements}
        className="flex items-center gap-2.5 overflow-hidden flex-1"
      >
        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-500/30 border border-indigo-400/40 text-indigo-200 font-bold text-[10px] shrink-0 uppercase tracking-wider">
          <Megaphone className="w-3 h-3 text-indigo-300 animate-pulse" /> Info Penting
        </span>
        <div className="overflow-hidden whitespace-nowrap text-ellipsis flex items-center gap-2">
          <span className="font-bold text-white group-hover:text-indigo-200 transition-colors">
            {current.title}
          </span>
          <span className="text-slate-300 hidden sm:inline">—</span>
          <span className="text-slate-300 hidden sm:inline truncate text-[11px]">
            {current.content.slice(0, 85)}...
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {announcements.length > 1 && (
          <button
            onClick={handleNext}
            className="px-2 py-0.5 rounded-lg bg-indigo-800/80 hover:bg-indigo-700 text-[10px] text-indigo-200 font-medium cursor-pointer"
            title="Pengumuman berikutnya"
          >
            {currentIndex + 1}/{announcements.length} ↻
          </button>
        )}
        <button
          onClick={onOpenAnnouncements}
          className="p-1 hover:bg-indigo-800 rounded-lg text-indigo-200 hover:text-white transition-colors cursor-pointer"
          title="Buka Pengumuman"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsDismissed(true);
          }}
          className="p-1 hover:bg-indigo-800 rounded-lg text-indigo-300 hover:text-white transition-colors cursor-pointer"
          title="Tutup banner"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X, Check } from 'lucide-react';
import { sfx } from '../../utils/soundEffects.ts';

interface DoodleDatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (val: string) => void;
  label?: string;
  id?: string;
  className?: string;
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const DAY_LABELS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

export const DoodleDatePicker: React.FC<DoodleDatePickerProps> = ({
  value,
  onChange,
  label,
  id,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const initialDate = value ? new Date(value) : new Date();
  const [viewYear, setViewYear] = useState(
    isNaN(initialDate.getTime()) ? new Date().getFullYear() : initialDate.getFullYear()
  );
  const [viewMonth, setViewMonth] = useState(
    isNaN(initialDate.getTime()) ? new Date().getMonth() : initialDate.getMonth()
  );

  useEffect(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
      }
    }
  }, [value]);

  const handleOpen = () => {
    sfx.playToggle();
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  const handleSelectDate = (day: number) => {
    sfx.playClick();
    const mm = String(viewMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    const formatted = `${viewYear}-${mm}-${dd}`;
    onChange(formatted);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  const handlePrevMonth = () => {
    sfx.playToggle();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(y => y - 1);
    } else {
      setViewMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    sfx.playToggle();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(y => y + 1);
    } else {
      setViewMonth(m => m + 1);
    }
  };

  const handleSetToday = () => {
    sfx.playClick();
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    onChange(`${yyyy}-${mm}-${dd}`);
    setIsOpen(false);
  };

  // Calculate calendar days
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  // Format display label
  const displayLabel = (() => {
    if (!value) return 'Pilih Tanggal';
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    return `${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
  })();

  const isSelectedDate = (day: number) => {
    if (!value) return false;
    const [y, m, d] = value.split('-').map(Number);
    return y === viewYear && m === viewMonth + 1 && d === day;
  };

  const isTodayDate = (day: number) => {
    const today = new Date();
    return (
      today.getFullYear() === viewYear &&
      today.getMonth() === viewMonth &&
      today.getDate() === day
    );
  };

  return (
    <div className={`relative inline-block w-full ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-xs font-bold uppercase text-slate-600 mb-1">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        ref={triggerRef}
        id={id}
        type="button"
        onClick={() => (isOpen ? handleClose() : handleOpen())}
        className="w-full min-h-[44px] px-3 py-2 text-xs sm:text-sm bg-white hover:bg-amber-50/50 border-2 border-slate-900 rounded-md font-mono font-bold text-slate-900 shadow-[2px_2px_0px_#1E293B] flex items-center justify-between gap-2 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400"
      >
        <span className="flex items-center gap-2 truncate">
          <CalendarIcon className="w-4 h-4 text-slate-700 shrink-0" />
          <span className="truncate">{displayLabel}</span>
        </span>
        <span className="text-[10px] text-slate-500 font-bold bg-slate-100 px-1.5 py-0.5 rounded border border-slate-300">
          Ubah
        </span>
      </button>

      {/* Calendar Overlay */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-slate-900/40 md:bg-transparent"
            onClick={handleClose}
          />

          <div
            className={`
              z-50 bg-[#FFFDF9] border-2 border-slate-900 shadow-2xl
              fixed inset-x-0 bottom-0 rounded-t-2xl p-4 animate-in slide-in-from-bottom duration-200
              md:absolute md:inset-x-0 md:bottom-auto md:top-full md:mt-1.5 md:rounded-xl md:shadow-[4px_4px_0px_#1E293B] md:p-3 md:w-72
            `}
          >
            {/* Header / Month Navigation */}
            <div className="flex items-center justify-between pb-2 mb-2 border-b-2 border-slate-900">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="w-8 h-8 rounded border-2 border-slate-900 bg-white hover:bg-slate-100 flex items-center justify-center text-slate-900 font-bold"
                aria-label="Bulan sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="text-xs sm:text-sm font-black text-slate-900 text-center">
                {MONTH_NAMES[viewMonth]} {viewYear}
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="w-8 h-8 rounded border-2 border-slate-900 bg-white hover:bg-slate-100 flex items-center justify-center text-slate-900 font-bold"
                  aria-label="Bulan berikutnya"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="md:hidden w-8 h-8 rounded border-2 border-slate-900 bg-white flex items-center justify-center text-slate-700 ml-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Day of Week Labels */}
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black text-slate-500 uppercase mb-1">
              {DAY_LABELS.map(d => (
                <div key={d} className="py-1">{d}</div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Empty leading days */}
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} className="p-1" />
              ))}

              {/* Month days */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const selected = isSelectedDate(day);
                const today = isTodayDate(day);

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleSelectDate(day)}
                    className={`
                      h-9 sm:h-8 rounded text-xs font-mono font-bold flex items-center justify-center transition-all border
                      ${selected
                        ? 'bg-amber-300 border-slate-900 text-slate-900 font-black shadow-[1px_1px_0px_#1E293B]'
                        : today
                        ? 'bg-sky-100 border-sky-400 text-sky-950 font-bold'
                        : 'border-transparent text-slate-700 hover:bg-amber-50 hover:border-slate-300'}
                    `}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            {/* Quick Action Footer */}
            <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between text-[11px]">
              <button
                type="button"
                onClick={handleSetToday}
                className="px-2.5 py-1 bg-amber-100 border border-slate-800 rounded text-slate-900 font-black hover:bg-amber-200"
              >
                Hari Ini
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="px-2.5 py-1 bg-slate-100 border border-slate-800 rounded text-slate-700 font-bold hover:bg-slate-200"
              >
                Tutup
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

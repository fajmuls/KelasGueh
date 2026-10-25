import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, X } from 'lucide-react';
import { sfx } from '../../utils/soundEffects.ts';

export interface DoodleSelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface DoodleSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: DoodleSelectOption[] | string[];
  placeholder?: string;
  className?: string;
  label?: string;
  id?: string;
}

export const DoodleSelect: React.FC<DoodleSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Pilih salah satu...',
  className = '',
  label,
  id,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  // Normalize options array
  const normalizedOptions: DoodleSelectOption[] = options.map((opt) => {
    if (typeof opt === 'string') {
      return { value: opt, label: opt };
    }
    return opt;
  });

  const selectedOption = normalizedOptions.find(o => o.value === value);

  const handleOpen = () => {
    sfx.playToggle();
    setIsOpen(true);
    const currentIndex = normalizedOptions.findIndex(o => o.value === value);
    setFocusedIndex(currentIndex >= 0 ? currentIndex : 0);
  };

  const handleClose = () => {
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  const handleSelect = (val: string) => {
    sfx.playClick();
    onChange(val);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleOpen();
      }
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      handleClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex(prev => (prev < normalizedOptions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex(prev => (prev > 0 ? prev - 1 : normalizedOptions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (focusedIndex >= 0 && focusedIndex < normalizedOptions.length) {
        handleSelect(normalizedOptions[focusedIndex].value);
      }
    }
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
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => (isOpen ? handleClose() : handleOpen())}
        onKeyDown={handleKeyDown}
        className="w-full min-h-[44px] px-3 py-2 text-xs sm:text-sm bg-amber-50 hover:bg-amber-100/60 border-2 border-slate-900 rounded-md font-bold text-slate-900 shadow-[2px_2px_0px_#1E293B] flex items-center justify-between gap-2 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400"
      >
        <span className="truncate flex items-center gap-2">
          {selectedOption?.icon && <span className="shrink-0">{selectedOption.icon}</span>}
          <span>{selectedOption ? selectedOption.label : placeholder}</span>
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-700 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Options Dropdown / Mobile Bottom Sheet */}
      {isOpen && (
        <>
          {/* Backdrop (Dark overlay for mobile bottom sheet) */}
          <div
            className="fixed inset-0 z-40 bg-slate-900/40 md:bg-transparent"
            onClick={handleClose}
          />

          {/* Desktop Popover / Mobile Bottom Sheet */}
          <div
            ref={listRef}
            role="listbox"
            tabIndex={-1}
            aria-activedescendant={focusedIndex >= 0 ? `opt-${focusedIndex}` : undefined}
            className={`
              z-50
              /* Mobile: Bottom Sheet */
              fixed inset-x-0 bottom-0 max-h-[70vh] rounded-t-2xl bg-[#FFFDF9] border-t-4 border-slate-900 shadow-2xl p-4 overflow-y-auto animate-in slide-in-from-bottom duration-200
              /* Desktop: Floating Popover */
              md:absolute md:inset-x-0 md:bottom-auto md:top-full md:mt-1.5 md:rounded-lg md:border-2 md:shadow-[3px_3px_0px_#1E293B] md:p-1.5 md:max-h-60
            `}
          >
            {/* Mobile Sheet Grab Handle & Header */}
            <div className="md:hidden flex items-center justify-between pb-3 mb-2 border-b-2 border-slate-900">
              <span className="text-xs font-black uppercase text-slate-800 tracking-wider">
                {label || placeholder}
              </span>
              <button
                type="button"
                onClick={handleClose}
                className="w-8 h-8 rounded-full border-2 border-slate-900 bg-white flex items-center justify-center text-slate-800"
                aria-label="Tutup pilihan"
              >
                <X className="w-4 h-4 stroke-[3]" />
              </button>
            </div>

            <div className="space-y-1">
              {normalizedOptions.map((opt, idx) => {
                const isSelected = opt.value === value;
                const isFocused = idx === focusedIndex;

                return (
                  <button
                    key={opt.value}
                    id={`opt-${idx}`}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(opt.value)}
                    onMouseEnter={() => setFocusedIndex(idx)}
                    className={`
                      w-full min-h-[48px] px-3.5 py-2.5 text-xs sm:text-sm font-bold text-left rounded-md flex items-center justify-between gap-2 transition-all
                      ${isSelected ? 'bg-amber-300 text-slate-950 font-black border-2 border-slate-900 shadow-[1px_1px_0px_#1E293B]' : 'text-slate-800 hover:bg-amber-100/60'}
                      ${isFocused && !isSelected ? 'bg-slate-100 ring-2 ring-slate-400' : ''}
                    `}
                  >
                    <span className="flex items-center gap-2 truncate">
                      {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                      <span className="truncate">{opt.label}</span>
                    </span>
                    {isSelected && <Check className="w-4 h-4 text-slate-900 stroke-[3] shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

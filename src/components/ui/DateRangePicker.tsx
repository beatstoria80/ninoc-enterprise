"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { DayPicker, DateRange } from 'react-day-picker';
import { format, subDays, startOfDay, isSameDay, subMonths } from 'date-fns';
import { id } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import "react-day-picker/dist/style.css";

interface DateRangePickerProps {
  value: string; // The current filter string (e.g. '28d' or 'custom:YYYY-MM-DD:YYYY-MM-DD')
  onChange: (value: string) => void;
}

const getStartOfToday = () => startOfDay(new Date());

const PRESETS = [
  { label: 'Hari Ini', value: '24h', getRange: () => ({ from: getStartOfToday(), to: getStartOfToday() }) },
  { label: '7 Hari Terakhir', value: '7d', getRange: () => ({ from: subDays(getStartOfToday(), 7), to: getStartOfToday() }) },
  { label: '28 Hari Terakhir', value: '28d', getRange: () => ({ from: subDays(getStartOfToday(), 28), to: getStartOfToday() }) },
  { label: '3 Bulan Terakhir', value: '90d', getRange: () => ({ from: subDays(getStartOfToday(), 90), to: getStartOfToday() }) },
  { label: 'Sepanjang Waktu', value: 'all', getRange: () => ({ from: subMonths(getStartOfToday(), 37), to: getStartOfToday() }) },
];

const parseLocalDate = (dateStr: string) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const [selectedRange, setSelectedRange] = useState<DateRange | undefined>(undefined);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile(); // Check initial
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const syncStateWithValue = () => {
    if (value.startsWith('custom:')) {
      const parts = value.split(':');
      if (parts.length === 3) {
        setSelectedRange({
          from: parseLocalDate(parts[1]),
          to: parseLocalDate(parts[2])
        });
        setActivePreset(null);
      }
    } else {
      const preset = PRESETS.find(p => p.value === value);
      if (preset) {
        setSelectedRange(preset.getRange());
        setActivePreset(value);
      }
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (range: DateRange | undefined, selectedDay: Date) => {
    setActivePreset(null);
    if (!selectedDay) return;

    const clickDate = startOfDay(selectedDay);

    // 1. Jika belum ada yang dipilih, ATAU rentang sudah lengkap (kedua tanggal terisi)
    // -> Mulai rentang baru dengan klik ini sebagai Start Date.
    if (!selectedRange || (selectedRange.from && selectedRange.to)) {
      setSelectedRange({ from: clickDate, to: undefined });
      return;
    }

    // 2. Jika baru ada Start Date (sedang mencari End Date)
    if (selectedRange.from && !selectedRange.to) {
      const fromDate = startOfDay(selectedRange.from);
      
      // Dukung klik mundur: Jika End Date dipilih sebelum Start Date, otomatis Swap (Tukar posisinya)
      if (clickDate < fromDate) {
        setSelectedRange({ from: clickDate, to: fromDate });
      } else {
        setSelectedRange({ from: fromDate, to: clickDate });
      }
      return;
    }
  };

  const applyPreset = (presetValue: string, range: DateRange) => {
    // Kita panggil onChange, efeknya useEffect akan sinkronisasi state
    onChange(presetValue);
    setIsOpen(false);
  };

  const handleApplyCustom = () => {
    if (selectedRange?.from && selectedRange?.to) {
      const fromStr = format(selectedRange.from, 'yyyy-MM-dd');
      const toStr = format(selectedRange.to, 'yyyy-MM-dd');
      onChange(`custom:${fromStr}:${toStr}`);
      setIsOpen(false);
    }
  };

  const getDisplayLabel = () => {
    // Label selalu merefleksikan 'value' prop (sumber kebenaran), BUKAN selectedRange internal
    // Hal ini agar label tidak berubah-ubah saat user baru mencoba memilih range namun belum klik 'Terapkan'
    if (value.startsWith('custom:')) {
      const parts = value.split(':');
      if (parts.length === 3) {
        const from = parseLocalDate(parts[1]);
        const to = parseLocalDate(parts[2]);
        if (isSameDay(from, to)) {
            return format(from, 'd MMM yyyy', { locale: id });
        }
        return `${format(from, 'd MMM', { locale: id })} - ${format(to, 'd MMM yyyy', { locale: id })}`;
      }
    } else {
      const preset = PRESETS.find(p => p.value === value);
      if (preset) return preset.label;
    }
    return 'Pilih Rentang Tanggal';
  };

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <button
        onClick={() => {
          if (!isOpen) {
            syncStateWithValue();
          }
          setIsOpen(!isOpen);
        }}
        className={cn(
          "bg-white border text-ink/80 hover:text-ink px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-all shadow-sm",
          isOpen ? "border-blue-500 ring-2 ring-blue-500/20" : "border-ink/15 hover:border-ink/30"
        )}
      >
        <CalendarIcon size={16} className="text-blue-600" />
        <span>{getDisplayLabel()}</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop for Mobile */}
            {isMobile && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsOpen(false)}
                className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm"
              />
            )}

            <motion.div
              initial={isMobile ? { opacity: 0, y: "100%" } : { opacity: 0, y: 8, scale: 0.95 }}
              animate={isMobile ? { opacity: 1, y: 0 } : { opacity: 1, y: 0, scale: 1 }}
              exit={isMobile ? { opacity: 0, y: "100%" } : { opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: isMobile ? 0.3 : 0.15, ease: [0.23, 1, 0.32, 1] }}
              className={cn(
                "z-[100] bg-white shadow-2xl flex flex-col md:flex-row overflow-hidden",
                isMobile 
                  ? "fixed inset-x-0 bottom-0 rounded-t-3xl max-h-[85vh] overflow-y-auto" 
                  : "absolute right-0 mt-2 rounded-xl border border-ink/10 md:w-max md:max-w-none origin-top-right"
              )}
            >
              {/* Handle untuk swipe down indicator di Mobile */}
              {isMobile && (
                <div className="w-full flex justify-center pt-3 pb-1 sticky top-0 bg-white z-10">
                  <div className="w-12 h-1.5 rounded-full bg-ink/20" />
                </div>
              )}

              {/* Calendar (Kiri) */}
              <div className="p-4 flex flex-col items-center md:items-start w-full">
                <style dangerouslySetInnerHTML={{__html: `
                  .rdp { --rdp-cell-size: 36px; --rdp-accent-color: #1a73e8; --rdp-background-color: #e8f0fe; margin: 0; font-family: inherit; }
                  
                  /* Default selected day (single day atau default) */
                  .rdp-day_selected {
                    background-color: var(--rdp-accent-color) !important;
                    color: white !important;
                    border-radius: 50% !important;
                    font-weight: 500;
                  }

                  /* Hari di tengah rentang waktu (Pill connector) */
                  .rdp-day_range_middle { 
                    background-color: var(--rdp-background-color) !important; 
                    color: #1a73e8 !important; /* Material Google Ads uses blue text for range */
                    border-radius: 0 !important;
                    font-weight: 500;
                  }
                  
                  /* Tanggal Start (Bentuk Kapsul Kiri) */
                  .rdp-day_range_start:not(.rdp-day_range_end) { 
                    background-color: var(--rdp-accent-color) !important; 
                    color: white !important; 
                    border-radius: 50% 0 0 50% !important; 
                  }

                  /* Tanggal End (Bentuk Kapsul Kanan) */
                  .rdp-day_range_end:not(.rdp-day_range_start) { 
                    background-color: var(--rdp-accent-color) !important; 
                    color: white !important; 
                    border-radius: 0 50% 50% 0 !important; 
                  }

                  /* Hover untuk tanggal yang tidak dipilih */
                  .rdp-button:hover:not([disabled]):not(.rdp-day_selected) { 
                    background-color: #f1f3f4; 
                    border-radius: 50%;
                  }
                `}} />
                <DayPicker
                  mode="range"
                  selected={selectedRange}
                  onSelect={handleSelect}
                  locale={id}
                  numberOfMonths={isMobile ? 1 : 2}
                  pagedNavigation
                  className="border-b border-ink/5 pb-4 w-full flex justify-center"
                />
                
                <div className="flex justify-between items-center mt-4 px-2 w-full">
                  <div className="text-sm font-medium text-ink/60">
                    {selectedRange?.from ? (
                      <>
                        {format(selectedRange.from, 'dd/MM/yyyy')} 
                        {selectedRange.to ? ` - ${format(selectedRange.to, 'dd/MM/yyyy')}` : ' - ...'}
                      </>
                    ) : (
                      "Pilih rentang tanggal"
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setIsOpen(false)}
                      className="px-4 py-2 text-sm font-medium text-[#1a73e8] hover:bg-[#1a73e8]/5 rounded-md transition-colors"
                    >
                      Batal
                    </button>
                    <button 
                      onClick={handleApplyCustom}
                      disabled={!selectedRange?.from || !selectedRange?.to}
                      className="bg-[#1a73e8] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#1765cc] text-white px-5 py-2 rounded-md text-sm font-medium transition-all shadow-sm"
                    >
                      Terapkan
                    </button>
                  </div>
                </div>
              </div>

              {/* Presets Sidebar (Kanan ala Google Ads) */}
              <div className="w-full md:w-48 bg-[#f8f9fa] border-t md:border-t-0 md:border-l border-ink/10 p-3 flex flex-col gap-1 pb-8 md:pb-3">
                <div className="text-xs font-bold text-ink/50 uppercase tracking-wider mb-2 px-3 pt-2">Rentang Waktu</div>
                {PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => applyPreset(preset.value, preset.getRange())}
                    className={cn(
                      "px-3 py-2 text-left text-sm font-medium rounded-md transition-colors",
                      activePreset === preset.value
                        ? "bg-[#e8f0fe] text-[#1a73e8]"
                        : "text-ink/70 hover:bg-black/5 hover:text-ink"
                    )}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { DayPicker, DateRange } from 'react-day-picker';
import { format, subDays, startOfDay, isSameDay } from 'date-fns';
import { id } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import "react-day-picker/dist/style.css";

interface DateRangePickerProps {
  value: string; // The current filter string (e.g. '28d' or 'custom:YYYY-MM-DD:YYYY-MM-DD')
  onChange: (value: string) => void;
}

const PRESETS = [
  { label: 'Hari Ini', value: '24h', getRange: () => ({ from: new Date(), to: new Date() }) },
  { label: '7 Hari Terakhir', value: '7d', getRange: () => ({ from: subDays(new Date(), 7), to: new Date() }) },
  { label: '28 Hari Terakhir', value: '28d', getRange: () => ({ from: subDays(new Date(), 28), to: new Date() }) },
  { label: '3 Bulan Terakhir', value: '90d', getRange: () => ({ from: subDays(new Date(), 90), to: new Date() }) },
  { label: 'Sepanjang Waktu', value: 'all', getRange: () => ({ from: new Date(2020, 0, 1), to: new Date() }) },
];

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize selected range from value
  const [selectedRange, setSelectedRange] = useState<DateRange | undefined>(() => {
    if (value.startsWith('custom:')) {
      const parts = value.split(':');
      if (parts.length === 3) {
        return {
          from: new Date(parts[1]),
          to: new Date(parts[2])
        };
      }
    } else {
      const preset = PRESETS.find(p => p.value === value);
      if (preset) return preset.getRange();
    }
    return undefined;
  });

  const [activePreset, setActivePreset] = useState<string | null>(value.startsWith('custom:') ? null : value);

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
    
    if (!selectedDay) {
      setSelectedRange(range);
      return;
    }

    if (!selectedRange || (!selectedRange.from && !selectedRange.to)) {
      setSelectedRange({ from: selectedDay });
      return;
    }

    if (selectedRange.from && selectedRange.to) {
      // Jika rentang sudah lengkap, dan user klik tanggal baru
      const distFrom = Math.abs(selectedDay.getTime() - selectedRange.from.getTime());
      const distTo = Math.abs(selectedDay.getTime() - selectedRange.to.getTime());

      // Pindahkan Start atau End berdasarkan mana yang terdekat dengan tanggal yang diklik
      if (distFrom <= distTo) {
        setSelectedRange({ from: selectedDay, to: selectedRange.to });
      } else {
        setSelectedRange({ from: selectedRange.from, to: selectedDay });
      }
      return;
    }

    if (selectedRange.from && !selectedRange.to) {
      // Jika baru Start date yang dipilih
      if (selectedDay < selectedRange.from) {
        setSelectedRange({ from: selectedDay, to: selectedRange.from });
      } else {
        setSelectedRange({ from: selectedRange.from, to: selectedDay });
      }
      return;
    }
  };

  const applyPreset = (presetValue: string, range: DateRange) => {
    setSelectedRange(range);
    setActivePreset(presetValue);
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
    if (activePreset) {
      return PRESETS.find(p => p.value === activePreset)?.label || 'Pilih Tanggal';
    }
    if (selectedRange?.from) {
      if (!selectedRange.to) {
        return format(selectedRange.from, 'd MMM yyyy', { locale: id });
      }
      if (isSameDay(selectedRange.from, selectedRange.to)) {
        return format(selectedRange.from, 'd MMM yyyy', { locale: id });
      }
      return `${format(selectedRange.from, 'd MMM', { locale: id })} - ${format(selectedRange.to, 'd MMM yyyy', { locale: id })}`;
    }
    return 'Pilih Rentang Tanggal';
  };

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
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
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 mt-2 z-50 bg-white rounded-xl shadow-2xl border border-ink/10 flex flex-col md:flex-row overflow-hidden"
            style={{ width: 'max-content' }}
          >
            {/* Presets Sidebar */}
            <div className="w-full md:w-48 bg-ink/[0.02] border-b md:border-b-0 md:border-r border-ink/10 p-3 flex flex-col gap-1">
              <div className="text-xs font-bold text-ink/50 uppercase tracking-wider mb-2 px-3 pt-2">Rentang Waktu</div>
              {PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => applyPreset(preset.value, preset.getRange())}
                  className={cn(
                    "px-3 py-2 text-left text-sm font-medium rounded-md transition-colors",
                    activePreset === preset.value
                      ? "bg-blue-50 text-blue-700"
                      : "text-ink/70 hover:bg-ink/5 hover:text-ink"
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Calendar */}
            <div className="p-4 flex flex-col">
              <style dangerouslySetInnerHTML={{__html: `
                .rdp { --rdp-cell-size: 36px; --rdp-accent-color: #2563eb; --rdp-background-color: #eff6ff; margin: 0; }
                
                /* Hari di tengah rentang waktu (warna soft blue) */
                .rdp-day_range_middle { 
                  background-color: var(--rdp-background-color) !important; 
                  color: #1e293b !important;
                  border-radius: 0 !important;
                }
                
                /* Tanggal Start dan End dengan background bulat solid */
                .rdp-day_range_start, .rdp-day_range_end, .rdp-day_selected:not(.rdp-day_range_middle) { 
                  background-color: var(--rdp-accent-color) !important; 
                  color: white !important; 
                  border-radius: 50% !important; 
                  font-weight: bold;
                }

                /* Hover untuk tanggal yang tidak dipilih */
                .rdp-button:hover:not([disabled]):not(.rdp-day_selected) { 
                  background-color: #f3f4f6; 
                  border-radius: 50%;
                }
              `}} />
              <DayPicker
                mode="range"
                selected={selectedRange}
                onSelect={handleSelect}
                locale={id}
                numberOfMonths={2}
                pagedNavigation
                className="border-b border-ink/5 pb-4"
              />
              
              <div className="flex justify-between items-center mt-4 px-2">
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
                    className="px-4 py-2 text-sm font-medium text-ink/70 hover:text-ink transition-colors"
                  >
                    Batal
                  </button>
                  <button 
                    onClick={handleApplyCustom}
                    disabled={!selectedRange?.from || !selectedRange?.to}
                    className="bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-bold transition-all shadow-sm"
                  >
                    Terapkan
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

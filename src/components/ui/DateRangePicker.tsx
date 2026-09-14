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

const getStartOfToday = () => startOfDay(new Date());

const PRESETS = [
  { label: 'Hari Ini', value: '24h', getRange: () => ({ from: getStartOfToday(), to: getStartOfToday() }) },
  { label: '7 Hari Terakhir', value: '7d', getRange: () => ({ from: subDays(getStartOfToday(), 7), to: getStartOfToday() }) },
  { label: '28 Hari Terakhir', value: '28d', getRange: () => ({ from: subDays(getStartOfToday(), 28), to: getStartOfToday() }) },
  { label: '3 Bulan Terakhir', value: '90d', getRange: () => ({ from: subDays(getStartOfToday(), 90), to: getStartOfToday() }) },
  { label: 'Sepanjang Waktu', value: 'all', getRange: () => ({ from: new Date(2020, 0, 1), to: getStartOfToday() }) },
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

  // Sinkronisasi state internal dengan prop `value` setiap kali popover dibuka atau `value` berubah
  useEffect(() => {
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
  }, [value, isOpen]);

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
    
    if (!selectedDay) return; // Fail-safe

    // Normalisasi waktu ke start of day agar kalkulasi jarak (distance) akurat tanpa terpengaruh jam/menit
    const normalizedSelectedDay = startOfDay(selectedDay);

    if (!selectedRange || (!selectedRange.from && !selectedRange.to)) {
      setSelectedRange({ from: normalizedSelectedDay });
      return;
    }

    const from = selectedRange.from ? startOfDay(selectedRange.from) : undefined;
    const to = selectedRange.to ? startOfDay(selectedRange.to) : undefined;

    if (from && to) {
      // Jika rentang sudah lengkap, dan user klik tanggal baru
      const distFrom = Math.abs(normalizedSelectedDay.getTime() - from.getTime());
      const distTo = Math.abs(normalizedSelectedDay.getTime() - to.getTime());

      // Pindahkan Start atau End berdasarkan mana yang terdekat
      if (distFrom <= distTo) {
        setSelectedRange({ from: normalizedSelectedDay, to });
      } else {
        setSelectedRange({ from, to: normalizedSelectedDay });
      }
      return;
    }

    if (from && !to) {
      // Jika baru Start date yang dipilih
      if (normalizedSelectedDay < from) {
        setSelectedRange({ from: normalizedSelectedDay, to: from });
      } else {
        setSelectedRange({ from, to: normalizedSelectedDay });
      }
      return;
    }
    
    if (!from && to) {
        // Edge case: to ada tapi from tidak ada
      if (normalizedSelectedDay > to) {
        setSelectedRange({ from: to, to: normalizedSelectedDay });
      } else {
        setSelectedRange({ from: normalizedSelectedDay, to });
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

"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Box, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnimatedShippingMapProps {
  currentStepIndex: number;
  isCancelled?: boolean;
}

export default function AnimatedShippingMap({ currentStepIndex, isCancelled = false }: AnimatedShippingMapProps) {
  // We represent the journey in 3 physical nodes for simplicity
  // Studio (0, 1, 2) -> In Transit (3) -> Delivered (4)
  
  let progress = 0;
  if (currentStepIndex <= 2) progress = 0; // At Studio
  else if (currentStepIndex === 3) progress = 50; // In Transit
  else if (currentStepIndex === 4) progress = 100; // Delivered

  return (
    <div className={cn(
      "w-full border rounded-[4px] p-6 mb-8 overflow-hidden relative h-[180px] transition-colors",
      isCancelled ? "bg-red-50/50 border-red-100" : "bg-ink/[0.01] border-ink/5"
    )}>
      <h3 className={cn(
        "text-[11px] md:text-[8px] uppercase tracking-widest mb-6 absolute top-6 left-6 z-10",
        isCancelled ? "text-red-500 font-bold" : "text-ink/50"
      )}>
        {isCancelled ? "Logistics Halted - Cancelled" : "Live Logistics Tracer"}
      </h3>
      
      <div className="absolute inset-0 flex items-center justify-center px-12 md:px-24">
        {/* Background Track */}
        <div className="w-full h-[1px] bg-ink/10 relative">
          
          {/* Animated Progress Line */}
          <motion.div 
            className={cn("absolute left-0 top-0 bottom-0", isCancelled ? "bg-red-500" : "bg-ink")}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          />

          {/* Tracer Pulse (The package moving) */}
          <motion.div
            className={cn("absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-2 rounded-full z-20", isCancelled ? "border-red-500" : "border-ink")}
            initial={{ left: 0 }}
            animate={{ left: `${progress}%` }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            style={{ x: '-50%' }}
          >
            <motion.div 
              className={cn("absolute inset-0 rounded-full", isCancelled ? "bg-red-500/30" : "bg-rose/20")}
              animate={isCancelled ? { scale: 1, opacity: 1 } : { scale: [1, 2.5, 1], opacity: [0.5, 0, 0.5] }}
              transition={isCancelled ? { duration: 0 } : { repeat: Infinity, duration: 2 }}
            />
          </motion.div>

          {/* Node 1: Origin */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 bg-white border border-ink/10 w-8 h-8 rounded flex items-center justify-center z-10 shadow-sm">
            <Box size={14} className={isCancelled ? "text-red-400" : "text-ink/60"} />
            <div className={cn("absolute -bottom-6 text-[11px] md:text-[8px] uppercase tracking-widest whitespace-nowrap", isCancelled ? "text-red-400" : "text-ink/60")}>Studio</div>
          </div>

          {/* Node 2: Transit */}
          <div className="absolute left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2 bg-white border border-ink/10 w-8 h-8 rounded flex items-center justify-center z-10 shadow-sm">
            <MapPin size={14} className={isCancelled ? "text-red-400" : (progress >= 50 ? "text-ink" : "text-ink/20")} />
            <div className={cn("absolute -bottom-6 text-[11px] md:text-[8px] uppercase tracking-widest whitespace-nowrap", isCancelled ? "text-red-400" : "text-ink/60")}>Transit Hub</div>
          </div>

          {/* Node 3: Destination */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 bg-white border border-ink/10 w-8 h-8 rounded flex items-center justify-center z-10 shadow-sm">
            <Home size={14} className={isCancelled ? "text-red-400" : (progress >= 100 ? "text-rose" : "text-ink/20")} />
            <div className={cn("absolute -bottom-6 text-[11px] md:text-[8px] uppercase tracking-widest whitespace-nowrap", isCancelled ? "text-red-400" : "text-ink/60")}>Consignee</div>
          </div>
        </div>
      </div>
    </div>
  );
}

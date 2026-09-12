"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';

interface Banner {
  id: string;
  title: string;
  desktop_image_url: string;
  tablet_image_url: string;
  mobile_image_url: string;
  link_url: string;
  is_active: boolean;
  order_index: number;
}

export function DynamicBanner() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  useEffect(() => {
    const fetchBanners = async () => {
      const { data } = await supabase
        .from('banners')
        .select('id, title, desktop_image_url, tablet_image_url, mobile_image_url, link_url, is_active, order_index')
        .eq('is_active', true)
        .order('order_index', { ascending: true });
        
      if (data && data.length > 0) {
        setBanners(data);
      }
    };
    fetchBanners();
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
    }, 6000); // switch every 6 seconds
    
    return () => clearInterval(interval);
  }, [banners.length]);

  if (banners.length === 0) return null;

  const currentBanner = banners[currentBannerIndex];

  return (
    <motion.div 
      className="w-full relative overflow-hidden bg-ink"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
    >
      <a href={currentBanner.link_url} className="block w-full group relative aspect-[9/16] sm:aspect-[4/3] md:aspect-[16/9] lg:aspect-[21/9]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentBanner.id}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="absolute inset-0 w-full h-full"
          >
            {/* Mobile (visible on very small screens) */}
            <picture>
              <source media="(min-width: 1024px)" srcSet={currentBanner.desktop_image_url} />
              <source media="(min-width: 640px)" srcSet={currentBanner.tablet_image_url} />
              <img 
                src={currentBanner.mobile_image_url} 
                alt={currentBanner.title}
                className="w-full h-full object-cover transition-transform duration-[20s] ease-out group-hover:scale-105"
                loading="eager"
              />
            </picture>
          </motion.div>
        </AnimatePresence>
        
        {/* Navigation Dots for Multiple Banners */}
        {banners.length > 1 && (
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-10">
            {banners.map((_, idx) => (
              <button 
                key={idx}
                onClick={(e) => { e.preventDefault(); setCurrentBannerIndex(idx); }}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${idx === currentBannerIndex ? 'bg-white scale-125 w-4' : 'bg-white/50'}`}
              />
            ))}
          </div>
        )}
      </a>
    </motion.div>
  );
}

"use client";

import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { DURATION, EASING } from '@/lib/animations';
import Link from '@/components/LocalizedLink';

function FadeUpSection({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-20px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: DURATION.medium, delay, ease: EASING.out }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function ConnectSection() {
  return (
    <FadeUpSection delay={0.1}>
      <section className="px-4 md:px-12 max-w-[1800px] mx-auto mb-0 pb-10 md:pb-16 mt-12">
        <div className="bg-white border border-ink/5 p-4 md:p-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {/* Instagram */}
            <a
              href="https://www.instagram.com/ninoc.co"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col items-center text-center p-6 border border-ink/5 hover:border-rose/30 hover:bg-rose/[0.02] transition-all relative z-50 pointer-events-auto"
            >
              <motion.div
                className="w-12 h-12 md:w-16 md:h-16 bg-ink/5 flex items-center justify-center mb-4"
                whileHover={{ backgroundColor: 'rgba(232, 82, 122, 0.1)', scale: 1.05 }}
                transition={{ duration: DURATION.fast }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-rose">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </motion.div>
              <p className="text-xs md:text-[10px] font-medium uppercase tracking-widest text-ink/60 mb-1">Follow Us</p>
              <p className="text-base md:text-sm font-display font-medium italic text-ink group-hover:text-rose transition-colors">@ninoc.co</p>
              <p className="text-xs md:text-[7px] text-ink/50 uppercase tracking-widest mt-1">Instagram</p>
            </a>

            {/* Email */}
            <a
              href="mailto:beatstoria.ai@gmail.com"
              className="group flex flex-col items-center text-center p-6 border border-ink/5 hover:border-rose/30 hover:bg-rose/[0.02] transition-all"
            >
              <motion.div
                className="w-12 h-12 md:w-16 md:h-16 bg-ink/5 flex items-center justify-center mb-4"
                whileHover={{ backgroundColor: 'rgba(232, 82, 122, 0.1)', scale: 1.05 }}
                transition={{ duration: DURATION.fast }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-rose">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </motion.div>
              <p className="text-xs md:text-[10px] font-medium uppercase tracking-widest text-ink/60 mb-1">Email Us</p>
              <p className="text-base md:text-sm font-display font-medium italic text-ink group-hover:text-rose transition-colors">beatstoria.ai@gmail.com</p>
              <p className="text-xs md:text-[7px] text-ink/50 uppercase tracking-widest mt-1">Direct Message</p>
            </a>

            {/* TikTok */}
            <a
              href="https://tiktok.com/@ninoc.co"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col items-center text-center p-6 border border-ink/5 hover:border-rose/30 hover:bg-rose/[0.02] transition-all relative z-50 pointer-events-auto"
            >
              <motion.div
                className="w-12 h-12 md:w-16 md:h-16 bg-ink/5 flex items-center justify-center mb-4"
                whileHover={{ backgroundColor: 'rgba(232, 82, 122, 0.1)', scale: 1.05 }}
                transition={{ duration: DURATION.fast }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-rose">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
                </svg>
              </motion.div>
              <p className="text-xs md:text-[10px] font-medium uppercase tracking-widest text-ink/60 mb-1">WhatsApp</p>
              <p className="text-base md:text-sm font-display font-medium italic text-ink group-hover:text-rose transition-colors">+62 8211983774</p>
              <p className="text-xs md:text-[7px] text-ink/50 uppercase tracking-widest mt-1">Chat Now</p>
            </a>
          </div>

          <div className="mt-8 pt-6 border-t border-ink/5 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-col">
              <p className="text-xs md:text-[10px] font-medium uppercase tracking-[0.4em] text-rose">NINOC ENTERPRISE STORE</p>
              <p className="text-base md:text-xs font-display font-medium italic text-ink mt-0.5">Style. Substance. Savor.</p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/about" className="px-5 py-2.5 bg-rose text-white text-sm md:text-[9px] font-semibold uppercase tracking-widest hover:bg-rose/90 transition-colors">
                About NINOC
              </Link>
              <Link href="/shop" className="px-5 py-2.5 border border-ink/10 text-ink/50 text-[10px] md:text-[9px] font-semibold uppercase tracking-widest hover:border-ink/20 hover:text-ink transition-colors">
                catalog
              </Link>
            </div>
          </div>
        </div>
      </section>
    </FadeUpSection>
  );
}

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, X, Lock as LockIcon } from 'lucide-react';

interface ConsentModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onClose: () => void;
}

export const ConsentModal: React.FC<ConsentModalProps> = ({ isOpen, onAccept, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-ink/40 backdrop-blur-[2px] z-[2000]"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="absolute inset-x-0 bottom-0 bg-white rounded-t-[32px] z-[2001] p-6 pb-12 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] max-h-[90%] overflow-y-auto"
          >
            <div className="max-w-md mx-auto relative pb-6">
              {/* Native bottom sheet drag handle */}
              <div className="w-12 h-1.5 bg-ink/10 rounded-full mx-auto mb-6" />

              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 bg-rose/10 rounded-2xl flex items-center justify-center text-rose">
                  <ShieldCheck size={24} />
                </div>
                <button onClick={onClose} className="p-2 -mr-2 text-ink/30 transition-colors hover:text-ink">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-1 mb-8 text-center pt-2">
                <h2 className="text-2xl font-display font-bold tracking-tight text-ink">
                  Kerahasiaan Anda Prioritas Kami
                </h2>
                <p className="text-[13px] text-ink/70 leading-relaxed pt-2 px-2 font-medium">
                  Sebelum melanjutkan, mohon tinjau bagaimana kami menjaga data pribadi Anda di Ninoc.
                </p>
              </div>

              <div className="space-y-6 mb-8 px-2">
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <ShieldCheck size={20} className="text-blue-500" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-ink mb-0.5">Enkripsi UU PDP</h4>
                    <p className="text-xs text-ink/80 leading-relaxed font-medium">
                      Format data sensitif (seperti nomor telepon dan email) dienkripsi mutlak di database.
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                    <LockIcon size={20} className="text-green-500" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-ink mb-0.5">Transaksi Aman</h4>
                    <p className="text-xs text-ink/80 leading-relaxed font-medium">
                      Layanan pembayaran & audit trail bekerja sama dengan Midtrans sesuai regulasi yang berlaku.
                    </p>
                  </div>
                </div>
              </div>

              <div className="px-2">
                <button
                  onClick={onAccept}
                  className="w-full bg-ink text-white py-4 rounded-full font-bold uppercase tracking-widest text-[11px] mb-4 hover:scale-[1.02] active:scale-[0.98] transition-transform"
                >
                  SAYA MENGERTI & SETUJU
                </button>
              </div>

              <p className="text-[10px] text-center text-ink/60 font-bold uppercase tracking-widest">
                VERSI KEBIJAKAN PRIVASI: 1.0.0
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

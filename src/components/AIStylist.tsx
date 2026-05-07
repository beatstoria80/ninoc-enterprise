import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, Loader2, RefreshCw, ShoppingBag } from 'lucide-react';
import { getStylistRecommendations } from '../services/geminiService';

interface Recommendation {
  name: string;
  price: number;
  color: string;
  reason: string;
}

export const AIStylist: React.FC = () => {
  const [preference, setPreference] = useState('');
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation[] | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!preference.trim()) return;

    setLoading(true);
    const result = await getStylistRecommendations(preference);
    setRecommendations(result);
    setLoading(false);
  };

  const handleReset = () => {
    setRecommendations(null);
    setPreference('');
  };

  return (
    <div className="w-full bg-white/40 backdrop-blur-3xl rounded-[3rem] border border-white/20 p-8 sm:p-12 shadow-editorial overflow-hidden relative group">
      {/* Background Glow */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-rose/10 blur-[80px] rounded-full pointer-events-none group-hover:bg-rose/20 transition-all duration-700"></div>
      
      <div className="relative z-10 space-y-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-ink text-white flex items-center justify-center shadow-lg shadow-ink/20">
              <Sparkles size={24} className="text-rose animate-pulse" />
            </div>
            <div>
              <h3 className="text-2xl font-display italic font-black text-ink">Beatstoria AI Stylist</h3>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-ink/30">Asisten Gaya Pribadi Anda</p>
            </div>
          </div>
          
          {recommendations && (
            <button 
              onClick={handleReset}
              className="w-10 h-10 rounded-full bg-ink/5 flex items-center justify-center text-ink/40 hover:bg-ink hover:text-white transition-all shadow-sm"
            >
              <RefreshCw size={18} />
            </button>
          )}
        </div>

        {!recommendations ? (
          <form onSubmit={handleGenerate} className="space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-ink/40 px-2">Ceritakan gaya atau acara yang Anda hadiri:</label>
              <div className="relative">
                <input
                  type="text"
                  value={preference}
                  onChange={(e) => setPreference(e.target.value)}
                  placeholder="Contoh: 'Acara pernikahan outdoor di Bali' atau 'Gaya minimalis untuk ke kantor'"
                  className="w-full bg-white/60 border border-ink/5 rounded-[2rem] px-8 py-5 text-sm font-medium outline-none focus:ring-4 ring-rose/5 transition-all shadow-inner placeholder:text-ink/20"
                />
                <button
                  type="submit"
                  disabled={loading || !preference.trim()}
                  className="absolute right-2 top-2 bottom-2 bg-ink text-white px-6 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-rose transition-all flex items-center gap-2 shadow-lg disabled:opacity-50"
                >
                  {loading ? <Loader2 size={14} className="animate-spin" /> : <>Generate <Sparkles size={14} /></>}
                </button>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3">
              {[
                "Minimalis Elegant",
                "Beach Party",
                "Work from Cafe",
                "Date Night",
                "Urban Streetwear"
              ].map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setPreference(tag)}
                  className="px-4 py-2 bg-ink/5 hover:bg-ink hover:text-white rounded-full text-[10px] font-bold transition-all border border-transparent hover:border-ink/10"
                >
                  {tag}
                </button>
              ))}
            </div>
          </form>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {recommendations.map((rec, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white/80 p-6 rounded-[2.5rem] border border-ink/5 shadow-sm hover:shadow-editorial transition-all group/item"
              >
                <div className="w-full aspect-square rounded-2xl mb-6 flex items-center justify-center relative overflow-hidden" style={{ background: `${rec.color}15` }}>
                   <div 
                     className="w-16 h-16 rounded-full animate-bounce shadow-xl"
                     style={{ backgroundColor: rec.color }}
                   ></div>
                   <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent"></div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <h4 className="text-sm font-black text-ink uppercase tracking-tight leading-tight">{rec.name}</h4>
                    <span className="text-[10px] font-bold text-rose">Rp {rec.price.toLocaleString('id-ID')}</span>
                  </div>
                  <p className="text-[10px] font-medium text-ink/50 leading-relaxed italic line-clamp-3">
                    "{rec.reason}"
                  </p>
                  <button className="w-full py-3 bg-ink-faint group-hover/item:bg-ink group-hover/item:text-white rounded-full text-[8px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                    Cari di Katalog <ArrowRight size={10} />
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};

"use client";
import React, { useState } from 'react';
import { BrainCircuit, Download, RefreshCw, Calendar, Target, Wallet, ListPlus, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// Helper for formatted IDR
const fIDR = (num: number) => num.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

export function CampaignPlannerTab() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasPlan, setHasPlan] = useState(false);
  
  // Campaign Setup Form State
  const [campaignName, setCampaignName] = useState('CAMP_SALES_NINOC_GEN_01');
  const [budget, setBudget] = useState(500000);
  const [duration, setDuration] = useState(30);
  const [objective, setObjective] = useState('OUTCOME_SALES');
  const [primaryAudience, setPrimaryAudience] = useState('Broad (Indonesia, 18-34)');
  
  // Generated AdSets State
  const [adSets, setAdSets] = useState<any[]>([]);

  const handleGeneratePlan = () => {
    setIsGenerating(true);
    // Simulate AI / Template Engine thinking time
    setTimeout(() => {
      // Basic AI logic for budget allocation (Template Engine Opsi A)
      // 60% Prospecting, 25% Stack/Niche, 15% Retargeting
      const broadBudget = Math.floor(budget * 0.6);
      const nicheBudget = Math.floor(budget * 0.25);
      const rtBudget = Math.floor(budget * 0.15);

      const generatedSets = [
        {
          id: 'ADSET_01_PROSPECTING',
          name: 'Broad_Prospecting_Auto',
          budget: broadBudget,
          audience: primaryAudience,
          location: 'Indonesia',
          ageMin: 18,
          ageMax: 34,
          placement: 'Advantage+',
          ads: [
            { name: 'AD01_Main_Video', title: 'Promo utama diskon 30%', copy: 'Diskon 30% all item untuk streetwear lovers.', link: 'https://ninoc.store', cta: 'SHOP_NOW' },
            { name: 'AD02_Carousel_Catalog', title: 'Koleksi terlaris NINOC', copy: 'Kaos yang paling sering sold out.', link: 'https://ninoc.store/collections/best-seller', cta: 'SHOP_NOW' }
          ]
        },
        {
          id: 'ADSET_02_NICHE',
          name: 'Niche_Stack_Interests',
          budget: nicheBudget,
          audience: 'Urban, Fashion, Music',
          location: 'Jakarta, Bandung, Surabaya',
          ageMin: 18,
          ageMax: 28,
          placement: 'Manual Feed Reels',
          ads: [
            { name: 'AD03_FitCheck_Reels', title: 'Review kaos & Fit check OOTD', copy: 'Kaos oversized paling pas buat nongkrong.', link: 'https://ninoc.store', cta: 'SHOP_NOW' }
          ]
        },
        {
          id: 'ADSET_03_RETARGETING',
          name: 'Retargeting_30D_VC_ATC',
          budget: rtBudget,
          audience: 'VC_30D + ATC_30D Exclude Purchase_30D',
          location: 'Indonesia',
          ageMin: 18,
          ageMax: 34,
          placement: 'Advantage+',
          ads: [
            { name: 'AD04_DPA_Reminder', title: 'Masih di keranjang?', copy: 'Checkout sekarang mumpung ada stok.', link: 'https://ninoc.store/cart', cta: 'SHOP_NOW' }
          ]
        }
      ];

      setAdSets(generatedSets);
      setHasPlan(true);
      setIsGenerating(false);
    }, 1500);
  };

  const handleDownloadCSV = () => {
    // Generate CSV for Meta Bulk Import matching user specification exactly
    const headers = [
      'Campaign Name', 'Campaign Objective', 'Ad Set Name', 'Ad Set Daily Budget',
      'Location', 'Age Min', 'Age Max', 'Detailed Targeting', 'Placement', 
      'Ad Name', 'Title', 'Body', 'Link', 'Call To Action', 'URL Tags'
    ];
    
    // Helper to escape CSV strings: wrap in quotes and escape internal quotes
    const escapeCSV = (str: any) => {
      if (str === null || str === undefined) return '""';
      const safeStr = String(str).replace(/"/g, '""');
      return `"${safeStr}"`;
    };

    let csvContent = headers.join(',') + '\n';
    
    adSets.forEach(set => {
      set.ads.forEach((ad: any) => {
        const row = [
          escapeCSV(campaignName),
          escapeCSV(objective),
          escapeCSV(set.name),
          escapeCSV(set.budget),
          escapeCSV(set.location),
          escapeCSV(set.ageMin),
          escapeCSV(set.ageMax),
          escapeCSV(set.audience),
          escapeCSV(set.placement),
          escapeCSV(ad.name),
          escapeCSV(ad.title),
          escapeCSV(ad.copy),
          escapeCSV(ad.link),
          escapeCSV(ad.cta),
          escapeCSV(`utm_source=meta&utm_campaign=${campaignName.toLowerCase().replace(/\s+/g, '_')}`)
        ];
        csvContent += row.join(',') + '\n';
      });
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${campaignName}_Bulk_Import.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 w-full pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-4">
        <h1 className="text-xl font-medium tracking-tight text-ink flex items-center gap-2">
          <BrainCircuit className="w-5 h-5 text-indigo-600" />
          AI Campaign Strategist
        </h1>
        <p className="text-xs md:text-sm text-ink/90 mt-1">
          Rencanakan struktur Meta & Google Ads dengan bantuan algoritma (Template Engine). Export langsung ke Bulk CSV.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Setup Form */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-ink/10 rounded-xl p-5 shadow-sm">
            <h2 className="text-sm font-bold text-ink mb-4 flex items-center gap-2 border-b border-ink/5 pb-2">
              <ListPlus size={16} className="text-indigo-500"/> Parameter Kampanye
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-ink/70 uppercase tracking-wider mb-1 block">Nama Kampanye</label>
                <input 
                  type="text" 
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-ink/10 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-ink/70 uppercase tracking-wider mb-1 block">Tujuan (Objective)</label>
                <select 
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-ink/10 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="OUTCOME_SALES">Sales (Conversions)</option>
                  <option value="OUTCOME_TRAFFIC">Traffic (Link Clicks)</option>
                  <option value="OUTCOME_ENGAGEMENT">Engagement</option>
                  <option value="OUTCOME_LEADS">Leads</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-ink/70 uppercase tracking-wider mb-1 block flex items-center gap-1">
                    <Wallet size={12}/> Daily Budget (Rp)
                  </label>
                  <input 
                    type="number" 
                    value={budget}
                    onChange={(e) => setBudget(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-ink/10 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-ink/70 uppercase tracking-wider mb-1 block flex items-center gap-1">
                    <Calendar size={12}/> Durasi (Hari)
                  </label>
                  <input 
                    type="number" 
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-ink/10 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-ink/70 uppercase tracking-wider mb-1 block flex items-center gap-1">
                  <Target size={12}/> Primary Audience Target
                </label>
                <input 
                  type="text" 
                  value={primaryAudience}
                  onChange={(e) => setPrimaryAudience(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-ink/10 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Contoh: Streetwear Fans 18-35"
                />
              </div>

              <button 
                onClick={handleGeneratePlan}
                disabled={isGenerating}
                className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-70"
              >
                {isGenerating ? <RefreshCw className="animate-spin w-4 h-4" /> : <BrainCircuit className="w-4 h-4" />}
                {isGenerating ? 'Menganalisis & Menyusun...' : 'Generate Strategic Plan'}
              </button>
            </div>
          </div>
          
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-xs text-indigo-800">
            <strong>Cara Kerja:</strong> AI (Template Engine) akan mengalokasikan budget Anda ({fIDR(budget)}/hari) ke dalam struktur Funnel yang optimal (Prospecting & Retargeting) berdasarkan pola performa historis.
          </div>
        </div>

        {/* RIGHT COLUMN: Output Strategy */}
        <div className="lg:col-span-8">
          {!hasPlan && !isGenerating && (
            <div className="h-full min-h-[300px] border-2 border-dashed border-ink/10 rounded-2xl flex flex-col items-center justify-center text-ink/40 p-8 text-center bg-gray-50/50">
              <BrainCircuit className="w-12 h-12 mb-3 opacity-20" />
              <p className="font-medium text-sm">Belum ada strategi yang di-*generate*.</p>
              <p className="text-xs mt-1">Silakan atur parameter di sebelah kiri dan klik tombol Generate.</p>
            </div>
          )}

          {isGenerating && (
            <div className="h-full min-h-[300px] border border-ink/5 rounded-2xl flex flex-col items-center justify-center text-indigo-500 p-8 text-center bg-white shadow-sm">
              <RefreshCw className="w-10 h-10 mb-4 animate-spin" />
              <p className="font-medium text-sm animate-pulse">Menghitung Alokasi Budget Optimal...</p>
            </div>
          )}

          {hasPlan && !isGenerating && (
            <div className="bg-white border border-ink/10 rounded-xl shadow-sm overflow-hidden flex flex-col h-full animate-in fade-in zoom-in-95 duration-300">
              <div className="bg-indigo-600 p-4 flex items-center justify-between">
                <div>
                  <h3 className="text-white font-bold text-sm flex items-center gap-2"><CheckCircle2 size={16}/> Draft Strategi Selesai</h3>
                  <p className="text-indigo-100 text-xs mt-0.5">Struktur siap diekspor ke Meta Ads Manager.</p>
                </div>
                <button 
                  onClick={handleDownloadCSV}
                  className="bg-white text-indigo-700 hover:bg-indigo-50 px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 transition-colors shadow-sm"
                >
                  <Download size={14}/> Bulk Import (CSV)
                </button>
              </div>

              <div className="p-5 flex-1 overflow-auto bg-gray-50/30">
                <div className="space-y-4">
                  {adSets.map((set, idx) => (
                    <div key={set.id} className="bg-white border border-ink/10 rounded-lg overflow-hidden shadow-sm">
                      <div className="bg-gray-50 px-4 py-2 border-b border-ink/5 flex justify-between items-center">
                        <div>
                          <span className="text-[10px] font-bold text-ink/40 uppercase tracking-wider block mb-0.5">Ad Set {idx + 1}</span>
                          <span className="font-semibold text-sm text-ink">{set.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-bold text-ink/40 uppercase tracking-wider block mb-0.5">Daily Budget</span>
                          <span className="font-mono font-bold text-indigo-600 text-sm">Rp {fIDR(set.budget)}</span>
                        </div>
                      </div>
                      
                      <div className="p-4 flex flex-col md:flex-row gap-4">
                        <div className="md:w-1/3 border-r border-ink/5 pr-4 space-y-3">
                          <div>
                            <span className="text-[10px] uppercase text-ink/50 font-bold tracking-widest block mb-0.5">Targeting</span>
                            <span className="text-xs text-ink/80">{set.audience}</span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase text-ink/50 font-bold tracking-widest block mb-0.5">Placement</span>
                            <span className="text-xs text-ink/80">{set.placement}</span>
                          </div>
                        </div>
                        <div className="md:w-2/3 space-y-2">
                          <span className="text-[10px] uppercase text-ink/50 font-bold tracking-widest block mb-1">Ad Creatives ({set.ads.length})</span>
                          {set.ads.map((ad: any, aIdx: number) => (
                            <div key={aIdx} className="bg-indigo-50/50 border border-indigo-100 rounded p-2.5 flex items-start gap-3">
                              <div className="bg-indigo-100 text-indigo-600 font-bold text-[10px] px-1.5 py-0.5 rounded mt-0.5">
                                {ad.cta || 'AD'}
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-ink">{ad.name}</p>
                                <p className="text-[11px] text-ink/70 mt-0.5">{ad.title} - {ad.copy}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-gray-50 border-t border-ink/10 p-3 text-center">
                <p className="text-[11px] text-ink/50">
                  Total Estimasi Spend: <strong className="font-mono text-ink/70">Rp {fIDR(budget * duration)}</strong> untuk {duration} Hari.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

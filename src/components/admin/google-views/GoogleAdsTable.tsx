"use client";

import React, { useState } from 'react';
import { Eye, ArrowDownRight, ChevronRight, ChevronDown, Layers, ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GoogleAdsData, GoogleAdGroup, GoogleAd } from '@/services/google/types';
import { getGoogleAdGroups, getGoogleAds } from '@/actions/googleAds';
import { GoogleAdInsightsDetailPane } from './GoogleAdInsightsDetailPane';

export function GoogleAdsTable({ 
  data, 
  timeFilter,
  selectedCampaignIds,
  setSelectedCampaignIds
}: { 
  data: GoogleAdsData; 
  timeFilter: string;
  selectedCampaignIds: Set<string>;
  setSelectedCampaignIds: React.Dispatch<React.SetStateAction<Set<string>>>;
}) {
  const [expandedCampaigns, setExpandedCampaigns] = useState<Set<string>>(new Set());
  const [expandedAdGroups, setExpandedAdGroups] = useState<Set<string>>(new Set());
  const [loadedAdGroups, setLoadedAdGroups] = useState<Record<string, GoogleAdGroup[]>>({});
  const [loadedAds, setLoadedAds] = useState<Record<string, GoogleAd[]>>({});
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const [selectedAdId, setSelectedAdId] = useState<string | null>(null);

  const fIDR = (num: any) => {
    const validNum = Number(num);
    if (isNaN(validNum) || validNum == null) return '0';
    return validNum.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  const toggleCampaign = async (campaignId: string) => {
    const newExpanded = new Set(expandedCampaigns);
    if (newExpanded.has(campaignId)) {
      newExpanded.delete(campaignId);
      setExpandedCampaigns(newExpanded);
      return;
    }
    
    newExpanded.add(campaignId);
    setExpandedCampaigns(newExpanded);

    if (!loadedAdGroups[campaignId]) {
      setLoadingMap(prev => ({ ...prev, [campaignId]: true }));
      try {
        const adGroups = await getGoogleAdGroups(campaignId, timeFilter);
        setLoadedAdGroups(prev => ({ ...prev, [campaignId]: adGroups }));
      } finally {
        setLoadingMap(prev => ({ ...prev, [campaignId]: false }));
      }
    }
  };

  const toggleAdGroup = async (adGroupId: string, campaignId: string) => {
    const newExpanded = new Set(expandedAdGroups);
    if (newExpanded.has(adGroupId)) {
      newExpanded.delete(adGroupId);
      setExpandedAdGroups(newExpanded);
      return;
    }
    
    newExpanded.add(adGroupId);
    setExpandedAdGroups(newExpanded);

    if (!loadedAds[adGroupId]) {
      setLoadingMap(prev => ({ ...prev, [adGroupId]: true }));
      try {
        const ads = await getGoogleAds(adGroupId, campaignId, timeFilter);
        setLoadedAds(prev => ({ ...prev, [adGroupId]: ads }));
      } finally {
        setLoadingMap(prev => ({ ...prev, [adGroupId]: false }));
      }
    }
  };

  const renderRow = (item: any, type: 'campaign' | 'adgroup' | 'ad', level: number) => {
    const isCampaign = type === 'campaign';
    const isAdGroup = type === 'adgroup';
    const isAd = type === 'ad';
    
    const isExpanded = isCampaign ? expandedCampaigns.has(item.id) : (isAdGroup ? expandedAdGroups.has(item.id) : false);
    const isLoading = loadingMap[item.id];
    
    const handleNameClick = () => {
      if (isCampaign) toggleCampaign(item.id);
      else if (isAdGroup) toggleAdGroup(item.id, item.campaignId);
      else if (isAd) setSelectedAdId(item.id);
    };

    return (
      <tr key={`${type}-${item.id}`} className={cn(
        "hover:bg-blue-50/30 transition-colors group",
        isAdGroup ? "bg-[#f8fafc]" : "",
        isAd ? "bg-[#f1f5f9]" : ""
      )}>
        {/* Sticky Name Column */}
        <td className={cn(
          "sticky left-0 group-hover:bg-blue-50/50 z-10 px-3 py-2.5 border-r border-ink/5 flex items-center gap-3",
          isCampaign ? "bg-white" : isAdGroup ? "bg-[#f8fafc]" : "bg-[#f1f5f9]"
        )}>
          <input 
            type="checkbox" 
            className={cn("rounded border-ink/20 text-blue-600 focus:ring-blue-500 w-3 h-3 cursor-pointer", !isCampaign && "opacity-0 cursor-default")} 
            checked={isCampaign ? selectedCampaignIds.has(item.id) : false} 
            onChange={(e) => {
              if (!isCampaign) return;
              const newSet = new Set(selectedCampaignIds);
              if (e.target.checked) newSet.add(item.id);
              else newSet.delete(item.id);
              setSelectedCampaignIds(newSet);
            }}
            disabled={!isCampaign}
          />
          
          <div className="flex-1 overflow-hidden flex items-center gap-1.5" style={{ paddingLeft: `${level * 16}px` }}>
            {!isAd && (
              <button onClick={handleNameClick} className="p-0.5 hover:bg-ink/5 rounded text-ink/40 hover:text-ink">
                {isLoading ? <span className="animate-spin text-[10px]">⏳</span> : (isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
              </button>
            )}
            {isAd && <ImageIcon size={12} className="text-ink/40 ml-4" />}
            
            <div className="flex-1 truncate">
              <p 
                onClick={handleNameClick}
                className={cn(
                  "text-[11px] font-semibold hover:underline cursor-pointer truncate",
                  isCampaign ? "text-blue-600" : isAdGroup ? "text-indigo-600" : "text-emerald-600"
                )} 
                title={item.name}
              >
                {item.name}
              </p>
              <p className="text-[9px] text-ink/40 mt-0.5 truncate flex items-center gap-1">
                <Eye size={9} /> ID: {item.id}
              </p>
            </div>
          </div>
        </td>

        {/* Delivery Status */}
        <td className="px-3 py-2.5">
          <div className="flex items-center gap-1.5">
            <span className={cn(
              "w-2 h-2 rounded-full",
              item.deliveryStatus === 'ENABLED' ? "bg-emerald-500" :
              item.deliveryStatus === 'PAUSED' ? "bg-ink/30" :
              "bg-rose-500"
            )} />
            <span className="text-[11px] font-medium text-ink/80 capitalize">
              {item.deliveryStatus.toLowerCase()}
            </span>
          </div>
        </td>

        <td className="px-3 py-2.5 text-[11px] text-ink/40 text-center">—</td>

        {/* Conversions */}
        <td className="px-3 py-2.5 text-right">
          <p className="text-[11px] font-semibold text-ink">{item.conversions}</p>
          {item.conversions > 0 && <p className="text-[8px] text-ink/50 mt-0.5">Pembelian</p>}
        </td>

        {/* CPA */}
        <td className="px-3 py-2.5 text-right">
          {item.cpa > 0 ? (
            <>
              <p className="text-[11px] font-mono font-medium text-ink">Rp {fIDR(item.cpa)}</p>
              <p className="text-[8px] text-ink/50 mt-0.5">Per Pembelian</p>
            </>
          ) : (
            <span className="text-[11px] text-ink/40">—</span>
          )}
        </td>

        {/* Budget */}
        <td className="px-3 py-2.5">
          <p className="text-[11px] text-ink/80 max-w-[140px] truncate" title={item.budget}>{item.budget}</p>
        </td>

        {/* Spend */}
        <td className="px-3 py-2.5 text-right">
          <p className="text-[11px] font-mono font-medium text-ink">Rp {fIDR(item.spend)}</p>
        </td>

        {/* Impressions */}
        <td className="px-3 py-2.5 text-right">
          <p className="text-[11px] font-mono text-ink">{item.impressions.toLocaleString('id-ID')}</p>
        </td>

        {/* Clicks */}
        <td className="px-3 py-2.5 text-right">
          <p className="text-[11px] font-mono text-ink">{item.clicks > 0 ? item.clicks.toLocaleString('id-ID') : '—'}</p>
        </td>
        
        {/* CTR */}
        <td className="px-3 py-2.5 text-right">
          <p className="text-[11px] font-mono text-ink">{item.impressions > 0 ? ((item.clicks/item.impressions)*100).toFixed(2) : 0}%</p>
        </td>

        {/* Impression Share */}
        <td className="px-3 py-2.5 text-center">
          <p className="text-[11px] text-ink/80">{item.searchImpressionShare !== '—' ? `${(Number(item.searchImpressionShare)*100).toFixed(2)}%` : '—'}</p>
        </td>
      </tr>
    );
  };

  if (data.campaigns.length === 0) return null;

  return (
    <>
      <div className="bg-white border border-ink/10 rounded-xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
        
        {/* Table Toolbar */}
        <div className="p-3 border-b border-ink/10 bg-ink/[0.02] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button className="bg-white border border-ink/10 shadow-sm px-3 py-1.5 rounded text-[11px] font-bold text-ink flex items-center gap-1.5 hover:bg-ink/[0.02]">
              <Layers size={14} className="text-blue-600" /> Kampanye Google <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-sm text-[9px] ml-1">{selectedCampaignIds.size} Dipilih</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse whitespace-nowrap min-w-[1200px]">
            <thead>
              <tr className="bg-white border-b border-ink/10">
                <th className="sticky left-0 bg-white z-10 px-3 py-2 border-r border-ink/10 min-w-[250px] max-w-[350px]">
                  <div className="flex items-center gap-3">
                    <input type="checkbox" className="rounded border-ink/20 text-blue-600 focus:ring-blue-500 w-3 h-3 cursor-pointer" defaultChecked />
                    <div className="flex-1 text-[10px] font-semibold text-ink/70 flex items-center gap-1">Nama Kampanye <ArrowDownRight size={10} className="text-ink/40" /></div>
                  </div>
                </th>
                <th className="px-3 py-2 text-[10px] font-semibold text-ink/70 min-w-[120px]">Status</th>
                <th className="px-3 py-2 text-[10px] font-semibold text-ink/70 min-w-[80px]">Tindakan</th>
                <th className="px-3 py-2 text-[10px] font-semibold text-ink/70 min-w-[100px] text-right">Konversi</th>
                <th className="px-3 py-2 text-[10px] font-semibold text-ink/70 min-w-[120px] text-right">CPA</th>
                <th className="px-3 py-2 text-[10px] font-semibold text-ink/70 min-w-[150px]">Anggaran</th>
                <th className="px-3 py-2 text-[10px] font-semibold text-ink/70 min-w-[130px] text-right">Total Biaya</th>
                <th className="px-3 py-2 text-[10px] font-semibold text-ink/70 min-w-[100px] text-right">Impresi</th>
                <th className="px-3 py-2 text-[10px] font-semibold text-ink/70 min-w-[100px] text-right">Klik</th>
                <th className="px-3 py-2 text-[10px] font-semibold text-ink/70 min-w-[80px] text-right">CTR</th>
                <th className="px-3 py-2 text-[10px] font-semibold text-ink/70 min-w-[120px] text-center">Search Impr. Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {data.campaigns.sort((a, b) => b.spend - a.spend).map(camp => (
                <React.Fragment key={camp.id}>
                  {renderRow(camp, 'campaign', 0)}
                  
                  {/* Render Ad Groups if Expanded */}
                  {expandedCampaigns.has(camp.id) && loadedAdGroups[camp.id]?.map(adgroup => (
                    <React.Fragment key={adgroup.id}>
                      {renderRow(adgroup, 'adgroup', 1)}
                      
                      {/* Render Ads if Expanded */}
                      {expandedAdGroups.has(adgroup.id) && loadedAds[adgroup.id]?.map(ad => (
                        renderRow(ad, 'ad', 2)
                      ))}
                    </React.Fragment>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="px-4 py-2 bg-ink/[0.01] border-t border-ink/5 flex items-center justify-between text-[10px] text-ink/50 font-medium">
          <p>Hasil dari {data.campaigns.length} kampanye aktif</p>
        </div>
      </div>

      {selectedAdId && (
        <GoogleAdInsightsDetailPane adId={selectedAdId} onClose={() => setSelectedAdId(null)} />
      )}
    </>
  );
}

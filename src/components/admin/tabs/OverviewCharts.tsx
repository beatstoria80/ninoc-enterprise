import React, { useMemo } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { motion } from 'framer-motion';

// --- Custom Tooltips ---
const CustomSalesTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-ink border border-white/10 shadow-2xl rounded-sm p-3 min-w-[150px]">
        <p className="text-[10px] font-medium text-white/60 uppercase tracking-widest mb-2">{label} 2026</p>
        <p className="text-lg font-bold text-white mb-1">{payload[0].value.toLocaleString('id-ID')} <span className="text-[10px] font-medium text-white/60 uppercase tracking-normal">Orders</span></p>
        <p className="text-[9px] text-emerald-400 font-medium uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 inline-block px-1.5 py-0.5 rounded-sm">+12% vs Last Month</p>
      </div>
    );
  }
  return null;
};

const CustomProfitTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-ink border border-white/20 shadow-2xl rounded-sm p-3 min-w-[150px]">
        <p className="text-[10px] font-medium text-white uppercase tracking-widest mb-2">{label} 2026</p>
        <p className="text-[9px] uppercase text-white mb-0.5 tracking-wider">Net Profit</p>
        <p className="text-lg font-bold text-white mb-2">
          <span className="text-[10px] font-medium text-white mr-1">IDR</span>
          {payload[0].value.toLocaleString('id-ID')}
        </p>
        <div className="w-full bg-white/20 h-px mb-2" />
        <p className="text-[9px] text-white font-medium uppercase tracking-wider">Target Achieved</p>
      </div>
    );
  }
  return null;
};

export default function OverviewCharts({ 
  salesData, 
  profitData 
}: { 
  salesData: any[], 
  profitData: any[] 
}) {
  
  // Find max profit to highlight
  const maxProfit = useMemo(() => {
    return Math.max(...profitData.map(d => d.profit));
  }, [profitData]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Sales Analytics */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="bg-white p-6 rounded-sm border border-ink/10 h-[340px] flex flex-col"
      >
        <div className="flex items-center justify-between mb-6 shrink-0">
          <div>
            <h3 className="text-sm font-medium text-ink uppercase tracking-wide">Sales Analytics</h3>
            <p className="text-[9px] text-ink/40 mt-1 uppercase tracking-widest">Order Volume by Month</p>
          </div>
          <select className="text-[10px] uppercase font-medium bg-ink/5 text-ink border-none rounded-sm py-1.5 px-2.5 focus:ring-0 outline-none cursor-pointer hover:bg-ink/10 transition-colors">
            <option>2026</option>
            <option>2025</option>
          </select>
        </div>
        <div className="flex-1 w-full min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={salesData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#E8527A" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#E8527A" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#9ca3af' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#9ca3af' }} />
              <Tooltip content={<CustomSalesTooltip />} cursor={{ stroke: '#E8527A', strokeWidth: 1, strokeDasharray: '4 4' }} />
              <Area 
                type="monotone" 
                dataKey="sales" 
                stroke="#E8527A" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorSales)" 
                isAnimationActive={true}
                animationDuration={1500}
                animationEasing="ease-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Profit Margin */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="bg-white p-6 rounded-sm border border-ink/10 h-[340px] flex flex-col"
      >
        <div className="flex items-center justify-between mb-6 shrink-0">
          <div>
            <h3 className="text-sm font-medium text-ink uppercase tracking-wide">Profit Margin</h3>
            <p className="text-[9px] text-ink/40 mt-1 uppercase tracking-widest">Net Profit per Month</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-[9px] text-ink/60 uppercase tracking-wider font-medium">
              <span className="w-2 h-2 rounded-sm bg-rose"></span> Peak
            </span>
            <span className="flex items-center gap-1.5 text-[9px] text-ink/60 uppercase tracking-wider font-medium">
              <span className="w-2 h-2 rounded-sm bg-ink/80"></span> Normal
            </span>
          </div>
        </div>
        <div className="flex-1 w-full min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={profitData} margin={{ top: 10, right: 0, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#9ca3af' }} dy={10} />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 9, fill: '#9ca3af' }}
                tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
              />
              <Tooltip cursor={{ fill: '#f9fafb' }} content={<CustomProfitTooltip />} />
              <Bar 
                dataKey="profit" 
                radius={[2, 2, 0, 0]} 
                barSize={32}
                isAnimationActive={true}
                animationDuration={1500}
                animationEasing="ease-out"
              >
                {profitData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.profit === maxProfit ? '#E8527A' : '#141414'} 
                    fillOpacity={entry.profit === maxProfit ? 1 : 0.8}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  );
}

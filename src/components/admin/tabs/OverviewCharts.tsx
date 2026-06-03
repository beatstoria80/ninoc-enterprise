import React, { useMemo } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { motion } from 'framer-motion';

// --- Custom Tooltips ---
const CustomSalesTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #e5e5e5', borderRadius: '4px', padding: '12px', minWidth: '160px', boxShadow: '0 4px 20px rgba(0,0,0,0.12)' }}>
        <p style={{ fontSize: '10px', fontWeight: 600, color: '#141414', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px' }}>{label} 2026</p>
        <p style={{ fontSize: '20px', fontWeight: 900, color: '#141414', marginBottom: '4px' }}>{payload[0].value.toLocaleString('id-ID')} <span style={{ fontSize: '10px', fontWeight: 600, color: '#666666', textTransform: 'uppercase' }}>Orders</span></p>
        <p style={{ fontSize: '9px', fontWeight: 600, color: '#059669', textTransform: 'uppercase', letterSpacing: '1px', backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', display: 'inline-block', padding: '2px 6px', borderRadius: '2px' }}>+12% vs Last Month</p>
      </div>
    );
  }
  return null;
};

const CustomProfitTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #e5e5e5', borderRadius: '4px', padding: '12px', minWidth: '160px', boxShadow: '0 4px 20px rgba(0,0,0,0.12)' }}>
        <p style={{ fontSize: '10px', fontWeight: 600, color: '#141414', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px' }}>{label} 2026</p>
        <p style={{ fontSize: '9px', fontWeight: 700, color: '#141414', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2px' }}>Net Profit</p>
        <p style={{ fontSize: '20px', fontWeight: 900, color: '#141414', marginBottom: '8px' }}>
          <span style={{ fontSize: '10px', fontWeight: 600, color: '#666666', marginRight: '4px' }}>IDR</span>
          {payload[0].value.toLocaleString('id-ID')}
        </p>
        <div style={{ width: '100%', height: '1px', backgroundColor: '#e5e5e5', marginBottom: '8px' }} />
        <p style={{ fontSize: '9px', fontWeight: 700, color: '#E8527A', textTransform: 'uppercase', letterSpacing: '1px' }}>Target Achieved</p>
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
              <div className="flex gap-0.5">
                <span className="w-1.5 h-2 rounded-[1px] bg-[#141414]"></span>
                <span className="w-1.5 h-2 rounded-[1px] bg-[#4F46E5]"></span>
                <span className="w-1.5 h-2 rounded-[1px] bg-[#E8527A]"></span>
                <span className="w-1.5 h-2 rounded-[1px] bg-[#F59E0B]"></span>
              </div>
              Monthly Performance Indexes
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
                {profitData.map((entry, index) => {
                  const BAR_COLORS = [
                    '#141414', '#4F46E5', '#10B981', '#E8527A', '#F59E0B', 
                    '#3B82F6', '#8B5CF6', '#14B8A6', '#EC4899', '#6366F1', 
                    '#84CC16', '#64748B'
                  ];
                  return (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={BAR_COLORS[index % BAR_COLORS.length]} 
                      fillOpacity={0.95}
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  );
}

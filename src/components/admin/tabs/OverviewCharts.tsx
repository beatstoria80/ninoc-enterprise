import React from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function OverviewCharts({ 
  salesData, 
  profitData 
}: { 
  salesData: any[], 
  profitData: any[] 
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Sales Analytics */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 h-[320px]">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wide">Sales Analytics</h3>
            <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">Order Volume by Month</p>
          </div>
          <select className="text-[10px] uppercase font-medium bg-gray-50 border-none rounded py-1 px-2 focus:ring-0">
            <option>2026</option>
            <option>2025</option>
          </select>
        </div>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={salesData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#E8527A" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#E8527A" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: '1px solid #f3f4f6', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                itemStyle={{ color: '#111827', fontSize: '12px', fontWeight: 500 }}
              />
              <Area 
                type="monotone" 
                dataKey="sales" 
                stroke="#E8527A" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorSales)" 
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Profit Margin */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 h-[320px]">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wide">Profit Margin</h3>
            <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">Net Profit per Month</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-[10px] text-gray-500 uppercase">
              <span className="w-2 h-2 rounded-full bg-ink"></span> Actual
            </span>
          </div>
        </div>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={profitData} margin={{ top: 0, right: 0, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#9ca3af' }}
                tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
              />
              <Tooltip 
                cursor={{ fill: '#f9fafb' }}
                contentStyle={{ borderRadius: '8px', border: '1px solid #f3f4f6', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                itemStyle={{ color: '#111827', fontSize: '12px', fontWeight: 500 }}
                formatter={(value: any) => [`IDR ${Number(value).toLocaleString('id-ID')}`, 'Profit']}
              />
              <Bar 
                dataKey="profit" 
                fill="#141414" 
                radius={[4, 4, 0, 0]} 
                barSize={32}
                isAnimationActive={false}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

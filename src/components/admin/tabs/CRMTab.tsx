"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  MessageSquare, Clock, CheckCircle, AlertTriangle,
  TrendingUp, TrendingDown, BarChart2, PieChart, RefreshCw
} from 'lucide-react';

interface AnalyticsData {
  period: string;
  summary: {
    totalTickets: number;
    openTickets: number;
    resolvedTickets: number;
    flaggedTickets: number;
    resolutionRate: number;
    avgFirstResponseMinutes: number;
    avgMessagesPerTicket: number;
  };
  priorityBreakdown: Record<string, number>;
  topCategories: { category: string; count: number; percentage: number }[];
  messages: { autoReplyCount: number; adminReplyCount: number; autoReplyRate: number };
  ticketsOverTime: { date: string; count: number }[];
  returStats: {
    total: number; pending: number; approved: number;
    rejected: number; completed: number; fraudSuspected: number;
  };
  topKeywords: { keyword: string; count: number }[];
}

function StatCard({
  label, value, sub, icon: Icon, color = 'rose', trend
}: {
  label: string; value: string | number;
  sub?: string; icon: React.ElementType;
  color?: string; trend?: 'up' | 'down';
}) {
  return (
    <div className="bg-white border border-ink/5 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[7px] font-semibold uppercase tracking-widest text-ink/30">{label}</p>
        <div className={cn('w-6 h-6 rounded-sm flex items-center justify-center',
          color === 'rose' ? 'bg-rose/10' : color === 'emerald' ? 'bg-emerald-50' : color === 'amber' ? 'bg-amber-50' : 'bg-blue-50'
        )}>
          <Icon size={12} className={
            color === 'rose' ? 'text-rose' : color === 'emerald' ? 'text-emerald-500' : color === 'amber' ? 'text-amber-500' : 'text-blue-500'
          } />
        </div>
      </div>
      <div className="flex items-end gap-1.5">
        <span className="text-[22px] font-display italic font-bold text-ink leading-none">{value}</span>
        {trend && (
          trend === 'up' ? <TrendingUp size={14} className="text-emerald-500 mb-1" /> : <TrendingDown size={14} className="text-red-500 mb-1" />
        )}
      </div>
      {sub && <p className="text-[8px] text-ink/30">{sub}</p>}
    </div>
  );
}

function MiniBar({ value, max, color = 'bg-rose' }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-ink/5 rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[8px] font-medium text-ink/40 w-6 text-right shrink-0">{value}</span>
    </div>
  );
}

function SimpleLineChart({ data }: { data: { date: string; count: number }[] }) {
  if (data.length === 0) return <p className="text-[9px] text-ink/20">No data</p>;
  const max = Math.max(...data.map(d => d.count), 1);
  const H = 60;
  const W = 280;
  const step = W / Math.max(data.length - 1, 1);
  const points = data.map((d, i) => {
    const x = i * step;
    const y = H - (d.count / max) * H;
    return `${x},${y}`;
  }).join(' ');
  const poly = `0,${H} ${points} ${W},${H}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(244,63,94)" stopOpacity="0.15" />
          <stop offset="100%" stopColor="rgb(244,63,94)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={poly} fill="url(#lineGrad)" />
      <polyline
        points={points}
        fill="none"
        stroke="rgb(244,63,94)"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {data.map((d, i) => {
        const x = i * step;
        const y = H - (d.count / max) * H;
        return (
          <circle key={i} cx={x} cy={y} r="2.5" fill="rgb(244,63,94)" />
        );
      })}
    </svg>
  );
}

function SimplePieChart({ data }: { data: { category: string; count: number; percentage: number }[] }) {
  const COLORS = ['#f43f5e', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];
  const SIZE = 80;
  const R = 36;
  const CX = SIZE / 2;
  const CY = SIZE / 2;
  const CIRCUMFERENCE = 2 * Math.PI * R;
  const slices = data.map((d, i) => ({
    ...d,
    dash: CIRCUMFERENCE * (d.percentage / 100),
    gap: CIRCUMFERENCE * 0.02,
    color: COLORS[i % COLORS.length],
  }));

  const positioned = slices.reduce<typeof slices & { offset: number }[]>((acc, s) => {
    const offset = acc.length > 0 ? acc[acc.length - 1].offset + acc[acc.length - 1].dash + acc[acc.length - 1].gap : 0;
    return [...acc, { ...s, offset }];
  }, []);

    return (
    <div className="flex items-center gap-4">
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="rgb(0,0,0,0.05)" strokeWidth="14" />
        {positioned.map((s, i) => (
          <circle
            key={i}
            cx={CX} cy={CY} r={R}
            fill="none"
            stroke={s.color}
            strokeWidth="14"
            strokeDasharray={`${s.dash} ${CIRCUMFERENCE - s.dash}`}
            strokeDashoffset={-s.offset}
            strokeLinecap="butt"
          />
        ))}
      </svg>
      <div className="flex-1 space-y-1.5">
        {data.map((d, i) => (
          <div key={d.category} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
            <span className="text-[8px] text-ink/60 capitalize flex-1 truncate">{d.category}</span>
            <span className="text-[8px] font-semibold text-ink/40">{d.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CRMTab() {
  const [period, setPeriod] = useState('30d');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const doFetch = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/crm/analytics?period=${period}`);
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error('[CRMTab]', err);
      } finally {
        setLoading(false);
      }
    };
    doFetch();
  }, [period]);

  const s = data?.summary;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div>
          <h2 className="text-[13px] font-display italic font-medium uppercase tracking-widest text-ink">Analytics</h2>
          <p className="text-[8px] text-ink/30 uppercase tracking-widest mt-0.5">Support CRM Dashboard</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-ink/5 rounded-sm p-0.5">
            {[['7d', '7D'], ['30d', '30D'], ['90d', '90D'], ['all', 'ALL']].map(([v, label]) => (
              <button
                key={v}
                onClick={() => setPeriod(v)}
                className={cn(
                  'px-2.5 py-1 text-[8px] font-semibold uppercase tracking-wider rounded-sm transition-colors',
                  period === v ? 'bg-rose text-white' : 'text-ink/30 hover:text-ink/60'
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={fetchAnalytics}
            className="w-7 h-7 bg-ink/5 flex items-center justify-center rounded-sm hover:bg-rose/10 transition-colors"
          >
            <RefreshCw size={11} className={cn('text-ink/40', loading && 'animate-spin')} />
          </motion.button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto minimal-scroll space-y-5 pr-1">
        {loading && !data ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-5 h-5 border-2 border-rose/30 border-t-rose rounded-full animate-spin" />
          </div>
        ) : data ? (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 gap-2">
              <StatCard
                label="Total Tickets" value={s?.totalTickets || 0}
                icon={MessageSquare} color="rose"
              />
              <StatCard
                label="Open Tickets" value={s?.openTickets || 0}
                icon={AlertTriangle} color="amber"
              />
              <StatCard
                label="Resolution Rate" value={`${s?.resolutionRate || 0}%`}
                sub="ticket resolved"
                icon={CheckCircle} color="emerald"
              />
              <StatCard
                label="Avg Response" value={s?.avgFirstResponseMinutes ? `${s.avgFirstResponseMinutes}m` : '—'}
                sub="first response"
                icon={Clock} color="blue"
              />
            </div>

            {/* Ticket Volume Over Time */}
            {data.ticketsOverTime.length > 0 && (
              <div className="bg-white border border-ink/5 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[7px] font-semibold uppercase tracking-widest text-ink/30">Ticket Volume</p>
                  <p className="text-[7px] text-ink/20">{data.ticketsOverTime.length} days</p>
                </div>
                <SimpleLineChart data={data.ticketsOverTime} />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              {/* Category Distribution */}
              {data.topCategories.length > 0 && (
                <div className="bg-white border border-ink/5 p-4 space-y-3">
                  <p className="text-[7px] font-semibold uppercase tracking-widest text-ink/30">Top Categories</p>
                  <SimplePieChart data={data.topCategories} />
                  <div className="space-y-1">
                    {data.topCategories.map(cat => (
                      <MiniBar key={cat.category} value={cat.count} max={data.topCategories[0]?.count || 1} />
                    ))}
                  </div>
                </div>
              )}

              {/* Messages Breakdown */}
              <div className="bg-white border border-ink/5 p-4 space-y-3">
                <p className="text-[7px] font-semibold uppercase tracking-widest text-ink/30">Messages</p>
                <div className="space-y-2.5">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-[8px] text-ink/50">Auto-reply</span>
                      <span className="text-[8px] font-semibold text-rose">{data.messages.autoReplyRate}%</span>
                    </div>
                    <div className="h-1.5 bg-ink/5 rounded-full overflow-hidden">
                      <div className="h-full bg-rose rounded-full transition-all" style={{ width: `${data.messages.autoReplyRate}%` }} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="bg-rose/5 rounded-sm p-2 space-y-0.5">
                      <p className="text-[14px] font-display italic font-bold text-rose">{data.messages.autoReplyCount}</p>
                      <p className="text-[7px] text-rose/60">Auto replies</p>
                    </div>
                    <div className="bg-ink/5 rounded-sm p-2 space-y-0.5">
                      <p className="text-[14px] font-display italic font-bold text-ink">{data.messages.adminReplyCount}</p>
                      <p className="text-[7px] text-ink/40">Manual replies</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Retur Stats */}
            <div className="bg-white border border-ink/5 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[7px] font-semibold uppercase tracking-widest text-ink/30">Retur Requests</p>
                <span className="text-[8px] font-semibold text-rose">{data.returStats.total} total</span>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {[
                  { label: 'Pending', value: data.returStats.pending, color: 'bg-amber-400', text: 'text-amber-500' },
                  { label: 'Approved', value: data.returStats.approved, color: 'bg-emerald-400', text: 'text-emerald-500' },
                  { label: 'Rejected', value: data.returStats.rejected, color: 'bg-red-400', text: 'text-red-500' },
                  { label: 'Completed', value: data.returStats.completed, color: 'bg-gray-400', text: 'text-gray-500' },
                  { label: 'Fraud', value: data.returStats.fraudSuspected, color: 'bg-red-600', text: 'text-red-600' },
                ].map(item => (
                  <div key={item.label} className="text-center space-y-1">
                    <div className={cn('w-full h-8 rounded-sm flex items-center justify-center', item.color + '/10')}>
                      <span className={cn('text-[13px] font-display italic font-bold', item.text)}>{item.value}</span>
                    </div>
                    <p className="text-[7px] text-ink/30 uppercase tracking-wider">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Priority Breakdown */}
            {Object.keys(data.priorityBreakdown).length > 0 && (
              <div className="bg-white border border-ink/5 p-4 space-y-3">
                <p className="text-[7px] font-semibold uppercase tracking-widest text-ink/30">Priority Breakdown</p>
                <div className="space-y-1.5">
                  {Object.entries(data.priorityBreakdown).map(([pri, count]) => {
                    const max = Math.max(...Object.values(data.priorityBreakdown), 1);
                    const color = pri === 'urgent' ? 'bg-red-400' : pri === 'high' ? 'bg-amber-400' : pri === 'normal' ? 'bg-blue-400' : 'bg-gray-300';
                    return (
                      <div key={pri} className="flex items-center gap-2">
                        <span className="text-[8px] text-ink/40 w-10 capitalize shrink-0">{pri}</span>
                        <div className="flex-1 h-1.5 bg-ink/5 rounded-full overflow-hidden">
                          <div className={cn('h-full rounded-full', color)} style={{ width: `${(count / max) * 100}%` }} />
                        </div>
                        <span className="text-[8px] font-medium text-ink/40 w-4 text-right">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Top Keywords */}
            {data.topKeywords.length > 0 && (
              <div className="bg-white border border-ink/5 p-4 space-y-3">
                <p className="text-[7px] font-semibold uppercase tracking-widest text-ink/30">Top Keywords</p>
                <div className="flex flex-wrap gap-1.5">
                  {data.topKeywords.map(kw => (
                    <span key={kw.keyword} className="inline-flex items-center gap-1 px-2 py-1 bg-rose/5 border border-rose/10 rounded-sm">
                      <span className="text-[8px] font-semibold text-rose capitalize">{kw.keyword}</span>
                      <span className="text-[7px] text-rose/40">{kw.count}x</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Summary row */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white border border-ink/5 p-3 text-center">
                <p className="text-[16px] font-display italic font-bold text-ink">{s?.resolvedTickets || 0}</p>
                <p className="text-[7px] text-ink/30 mt-0.5">Resolved</p>
              </div>
              <div className="bg-white border border-ink/5 p-3 text-center">
                <p className="text-[16px] font-display italic font-bold text-rose">{s?.flaggedTickets || 0}</p>
                <p className="text-[7px] text-ink/30 mt-0.5">Flagged</p>
              </div>
              <div className="bg-white border border-ink/5 p-3 text-center">
                <p className="text-[16px] font-display italic font-bold text-ink">{s?.avgMessagesPerTicket || 0}</p>
                <p className="text-[7px] text-ink/30 mt-0.5">Msg/ticket</p>
              </div>
            </div>
          </>
        ) : (
          <div className="py-12 text-center">
            <p className="text-[9px] text-ink/30">No analytics data available</p>
          </div>
        )}
      </div>
    </div>
  );
}

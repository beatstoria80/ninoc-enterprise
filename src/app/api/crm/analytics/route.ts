import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin as adminClient } from '@/lib/supabaseAdmin';



export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || '30d';
    const startDate = new Date();
    if (period === '7d') startDate.setDate(startDate.getDate() - 7);
    else if (period === '30d') startDate.setDate(startDate.getDate() - 30);
    else if (period === '90d') startDate.setDate(startDate.getDate() - 90);
    else startDate.setFullYear(startDate.getFullYear() - 10);
    const startStr = startDate.toISOString();

    // Fetch tickets
    const { data: tickets, error: ticketsErr } = await adminClient
      .from('support_tickets')
      .select('*')
      .gte('created_at', startStr)
      .order('created_at', { ascending: true });
    if (ticketsErr) throw ticketsErr;

    const totalTickets = tickets.length;
    const openTickets = tickets.filter(t => t.status === 'open').length;
    const resolvedTickets = tickets.filter(t => t.status === 'resolved').length;
    const flaggedTickets = tickets.filter(t => t.flagged_severity).length;
    const resolutionRate = totalTickets > 0 ? Math.round((resolvedTickets / totalTickets) * 100) : 0;

    // Priority breakdown
    const priorityCounts: Record<string, number> = {};
    for (const t of tickets) {
      const p = t.priority || 'normal';
      priorityCounts[p] = (priorityCounts[p] || 0) + 1;
    }

    // Category distribution
    const categoryCounts: Record<string, number> = {};
    for (const t of tickets) {
      const cat = t.category || 'general';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    }
    const topCategories = Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([cat, count]) => ({ category: cat, count, percentage: Math.round((count / totalTickets) * 100) }));

    // Messages stats
    const ticketIds = tickets.map(t => t.id);
    let autoReplyCount = 0;
    let adminReplyCount = 0;
    let avgMessagesPerTicket = 0;
    if (ticketIds.length > 0) {
      const { data: messages } = await adminClient
        .from('support_messages')
        .select('sender_role, is_auto_reply, ticket_id')
        .in('ticket_id', ticketIds);
      if (messages) {
        autoReplyCount = messages.filter((m: { is_auto_reply: boolean }) => m.is_auto_reply).length;
        adminReplyCount = messages.filter((m: { sender_role: string; is_auto_reply?: boolean }) => m.sender_role === 'admin' && !m.is_auto_reply).length;
        const msgCountByTicket: Record<string, number> = {};
        for (const m of messages) {
          msgCountByTicket[m.ticket_id] = (msgCountByTicket[m.ticket_id] || 0) + 1;
        }
        const totalMsgs = Object.values(msgCountByTicket).reduce((s, c) => s + c, 0);
        avgMessagesPerTicket = totalTickets > 0 ? Math.round(totalMsgs / totalTickets * 10) / 10 : 0;
      }
    }
    const autoReplyRate = (autoReplyCount + adminReplyCount) > 0
      ? Math.round((autoReplyCount / (autoReplyCount + adminReplyCount)) * 100) : 0;

    // Response time
    const ticketsWithResponse = tickets.filter(t => t.first_response_at);
    let avgFirstResponseMinutes = 0;
    if (ticketsWithResponse.length > 0) {
      let totalMin = 0;
      for (const t of ticketsWithResponse) {
        const created = new Date(t.created_at).getTime();
        const responded = new Date(t.first_response_at).getTime();
        totalMin += (responded - created) / 60000;
      }
      avgFirstResponseMinutes = Math.round(totalMin / ticketsWithResponse.length);
    }

    // Tickets over time (daily)
    const dailyCounts: Record<string, number> = {};
    for (const t of tickets) {
      const day = t.created_at.slice(0, 10);
      dailyCounts[day] = (dailyCounts[day] || 0) + 1;
    }
    const ticketsOverTime = Object.entries(dailyCounts)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({ date, count }));

    // Retur stats
    const { data: returs } = await adminClient
      .from('retur_requests')
      .select('status, fraud_suspected')
      .gte('created_at', startStr);
    const returStats = {
      total: returs?.length || 0,
      pending: returs?.filter((r: { status: string }) => r.status === 'pending').length || 0,
      approved: returs?.filter((r: { status: string }) => r.status === 'approved').length || 0,
      rejected: returs?.filter((r: { status: string }) => r.status === 'rejected').length || 0,
      completed: returs?.filter((r: { status: string }) => r.status === 'completed').length || 0,
      fraudSuspected: returs?.filter((r: { fraud_suspected: boolean }) => r.fraud_suspected).length || 0,
    };

    // Top keywords
    const { data: recentMessages } = await adminClient
      .from('support_messages')
      .select('message')
      .in('ticket_id', ticketIds.slice(0, 100))
      .gte('created_at', startStr);
    const keywordCounts: Record<string, number> = {};
    const keywords = ['retur', 'refund', 'tukar', 'rusak', 'salah', 'belum', 'sampai', 'bayar', 'transfer', 'bukti', 'ongkir', 'size', 'warna', 'kirim', 'lacak', 'resi', 'jne', 'j&t'];
    if (recentMessages) {
      for (const msg of recentMessages) {
        const lower = msg.message.toLowerCase();
        for (const kw of keywords) {
          if (lower.includes(kw)) keywordCounts[kw] = (keywordCounts[kw] || 0) + 1;
        }
      }
    }
    const topKeywords = Object.entries(keywordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([keyword, count]) => ({ keyword, count }));

    return NextResponse.json({
      period,
      summary: { totalTickets, openTickets, resolvedTickets, flaggedTickets, resolutionRate, avgFirstResponseMinutes, avgMessagesPerTicket },
      priorityBreakdown: priorityCounts,
      topCategories,
      messages: { autoReplyCount, adminReplyCount, autoReplyRate },
      ticketsOverTime,
      returStats,
      topKeywords,
    });
  } catch (err) {
    console.error('[GET /api/crm/analytics]', err);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}

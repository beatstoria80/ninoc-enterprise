'use client';

import React from 'react';
import { Download } from 'lucide-react';
import { format } from 'date-fns';

interface ExportCSVButtonProps {
  orders: any[];
}

export default function ExportCSVButton({ orders }: ExportCSVButtonProps) {
  const handleExport = () => {
    // We only export safe fields (No customer PII)
    const headers = ['Order ID', 'Date', 'Status', 'Courier', 'Total Items'];
    
    const rows = orders.map(order => [
      order.id,
      order.created_at ? format(new Date(order.created_at), 'yyyy-MM-dd HH:mm:ss') : 'N/A',
      order.status,
      order.courier || 'N/A',
      order.itemsCount || 0
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ninoc_logistics_audit_${format(new Date(), 'yyyyMMdd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Revoke the object URL to avoid memory leak
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  };

  return (
    <button
      onClick={handleExport}
      className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 text-ink text-sm font-medium rounded-full hover:bg-gray-50 transition-colors"
    >
      <Download size={16} />
      Export Audit Report
    </button>
  );
}

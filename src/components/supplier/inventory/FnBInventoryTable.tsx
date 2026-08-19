'use client';

import React from 'react';
import { ArrowUpDown, AlertTriangle, ShieldCheck } from 'lucide-react';
import { BaseInventoryTable } from './BaseInventoryTable';

interface FnBInventoryTableProps {
  products: any[];
}

export function FnBInventoryTable({ products }: FnBInventoryTableProps) {
  return (
    <BaseInventoryTable
      products={products}
      pillarFallbackCategory="F&B"
      emptyStateText="No F&B products allocated yet."
      columnTitle3={
        <div className="flex items-center gap-1 cursor-pointer hover:text-gray-900">
          Total Stock <ArrowUpDown size={12} />
        </div>
      }
      columnTitle4="Logistics Constraints"
      renderColumn3={(product, totalStock) => (
        <span className={`font-medium ${totalStock > 0 ? 'text-gray-900' : 'text-rose-500'}`}>
          {totalStock} units
        </span>
      )}
      renderColumn4={(product, totalStock, isPerishable) => (
        <>
          {isPerishable ? (
            <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-2.5 py-1.5 border border-amber-100 w-fit">
              <AlertTriangle size={12} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Instan/Sameday Only</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2.5 py-1.5 border border-emerald-100 w-fit">
              <ShieldCheck size={12} />
              <span className="text-[10px] font-bold uppercase tracking-widest">National Shipping</span>
            </div>
          )}
        </>
      )}
    />
  );
}

'use client';

import React from 'react';
import { ArrowUpDown } from 'lucide-react';
import { BaseInventoryTable } from './BaseInventoryTable';

interface FashionInventoryTableProps {
  products: any[];
}

export function FashionInventoryTable({ products }: FashionInventoryTableProps) {
  return (
    <BaseInventoryTable
      products={products}
      pillarFallbackCategory="Uncategorized"
      emptyStateText="No fashion products allocated yet."
      columnTitle3={
        <div className="flex items-center gap-1 cursor-pointer hover:text-gray-900">
          Total Stock <ArrowUpDown size={12} />
        </div>
      }
      columnTitle4="Variants Matrix"
      renderColumn3={(product, totalStock) => (
        <span className="font-medium text-gray-900">
          {totalStock} units
        </span>
      )}
      renderColumn4={(product) => (
        <div className="flex flex-col gap-1 max-h-24 overflow-y-auto pr-2">
          {product.product_variants && product.product_variants.length > 0 ? (
            product.product_variants.map((v: any) => (
              <div key={v.id} className="flex justify-between items-center text-[10px] bg-gray-50 px-2 py-1 border border-gray-100">
                <span className="text-gray-600 font-medium w-16">
                  {v.size || 'OS'} / {v.color?.substring(0, 3).toUpperCase() || 'NON'}
                </span>
                <span className={`font-bold ${v.stock_quantity > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                  {v.stock_quantity || 0}
                </span>
              </div>
            ))
          ) : (
            <span className="text-gray-400 text-[10px] italic">No variants</span>
          )}
        </div>
      )}
    />
  );
}

'use client';

import React from 'react';
import Image from 'next/image';
import { Package, ArrowUpDown, AlertTriangle, ShieldCheck } from 'lucide-react';

interface FnBInventoryTableProps {
  products: any[];
}

export function FnBInventoryTable({ products }: FnBInventoryTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs whitespace-nowrap font-mono">
        <thead className="text-[10px] tracking-widest text-gray-400 border-b border-gray-200 uppercase bg-white">
          <tr>
            <th className="px-6 py-4 font-medium">F&B Details</th>
            <th className="px-6 py-4 font-medium">Type</th>
            <th className="px-6 py-4 font-medium">
              <div className="flex items-center gap-1 cursor-pointer hover:text-gray-900">
                Total Stock <ArrowUpDown size={12} />
              </div>
            </th>
            <th className="px-6 py-4 font-medium">Logistics Constraints</th>
            <th className="px-6 py-4 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {products.length > 0 ? (
            products.map((product) => {
              const totalStock = product.product_variants && product.product_variants.length > 0
                ? product.product_variants.reduce((acc: number, v: any) => acc + (v.stock_quantity || 0), 0)
                : (product.stock || 0);
              
              const isPerishable = Boolean(product.is_perishable);
              
              return (
                <tr key={product.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-50 border border-gray-200 relative shrink-0">
                        {product.image_url ? (
                          <Image src={product.image_url} alt={product.name} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package size={16} className="text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium font-sans text-gray-900 truncate max-w-[200px]">{product.name}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5 tracking-widest">ID: {product.id.split('-')[0]}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600 capitalize">
                    {product.category || 'F&B'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`font-medium ${totalStock > 0 ? 'text-gray-900' : 'text-rose-500'}`}>
                      {totalStock} units
                    </span>
                  </td>
                  <td className="px-6 py-4">
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
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-ink font-medium text-xs hover:underline">
                      Manage Stock
                    </button>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="w-12 h-12 bg-gray-50 border border-gray-100 flex items-center justify-center mb-3">
                    <Package size={16} className="text-gray-300" />
                  </div>
                  <p className="font-sans text-xs">No F&B products allocated yet.</p>
                  <p className="text-[10px] mt-1 text-gray-400">Upload your menu/catalogs in the submission tab.</p>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

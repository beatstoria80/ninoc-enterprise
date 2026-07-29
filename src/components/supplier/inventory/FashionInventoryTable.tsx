'use client';

import React from 'react';
import Image from 'next/image';
import { Package, ArrowUpDown } from 'lucide-react';

interface FashionInventoryTableProps {
  products: any[];
}

export function FashionInventoryTable({ products }: FashionInventoryTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm whitespace-nowrap">
        <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-medium">
          <tr>
            <th className="px-6 py-4">Product Details</th>
            <th className="px-6 py-4">Category</th>
            <th className="px-6 py-4">
              <div className="flex items-center gap-1 cursor-pointer hover:text-gray-900">
                Total Stock <ArrowUpDown size={14} />
              </div>
            </th>
            <th className="px-6 py-4">Variants Matrix</th>
            <th className="px-6 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {products.length > 0 ? (
            products.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50/50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden relative shrink-0">
                      {product.image_url ? (
                        <Image src={product.image_url} alt={product.name} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package size={20} className="text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 truncate max-w-[200px]">{product.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">ID: {product.id.split('-')[0]}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-600 capitalize">
                  {product.category || 'Uncategorized'}
                </td>
                <td className="px-6 py-4">
                  <span className="font-medium text-gray-900">
                    {product.product_variants && product.product_variants.length > 0
                      ? product.product_variants.reduce((acc: number, v: any) => acc + (v.stock_quantity || 0), 0)
                      : (product.stock || 0)} units
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1 max-h-24 overflow-y-auto pr-2">
                    {product.product_variants && product.product_variants.length > 0 ? (
                      product.product_variants.map((v: any) => (
                        <div key={v.id} className="flex justify-between items-center text-xs bg-gray-50 px-2 py-1 rounded">
                          <span className="text-gray-600 font-medium w-16">
                            {v.size || 'OS'} / {v.color?.substring(0, 3).toUpperCase() || 'NON'}
                          </span>
                          <span className={`font-semibold ${v.stock_quantity > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                            {v.stock_quantity || 0}
                          </span>
                        </div>
                      ))
                    ) : (
                      <span className="text-gray-400 text-xs italic">No variants</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-ink font-medium text-xs hover:underline">
                    Edit Stock
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                <div className="flex flex-col items-center justify-center">
                  <Package size={32} className="text-gray-300 mb-3" />
                  <p>No fashion products allocated yet.</p>
                  <p className="text-sm mt-1">Upload your catalogs in the submission tab.</p>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

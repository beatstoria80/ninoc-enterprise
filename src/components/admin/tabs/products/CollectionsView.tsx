import React from 'react';
import { Plus, MoreHorizontal, Calendar, Tag, Search } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

const MOCK_COLLECTIONS = [
  {
    id: '1',
    name: 'Ramadhan Sale 2026',
    status: 'active',
    startDate: '2026-02-15',
    endDate: '2026-03-20',
    productCount: 45,
    bannerUrl: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?q=80&w=600&auto=format&fit=crop', // Pattern/abstract
    type: 'Manual'
  },
  {
    id: '2',
    name: 'Summer Essentials',
    status: 'scheduled',
    startDate: '2026-06-01',
    endDate: '2026-08-31',
    productCount: 120,
    bannerUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=600&auto=format&fit=crop', // Beach
    type: 'Smart (Tag: Summer)'
  },
  {
    id: '3',
    name: 'Clearance 50%',
    status: 'draft',
    startDate: null,
    endDate: null,
    productCount: 0,
    bannerUrl: null,
    type: 'Smart (Stock < 5)'
  }
];

export function CollectionsView() {
  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search collections..."
            className="w-full pl-9 pr-4 py-1.5 bg-white border border-gray-200 rounded text-sm focus:outline-none focus:border-rose/50"
          />
        </div>
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-ink text-white rounded hover:bg-ink/90 transition-colors">
          <Plus size={12} />
          <span className="text-[9px] uppercase tracking-wider">Create Collection</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto minimal-scroll pb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {MOCK_COLLECTIONS.map(collection => (
            <div key={collection.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden group hover:border-gray-200 transition-colors cursor-pointer flex flex-col">
              <div className="h-32 bg-gray-50 relative">
                {collection.bannerUrl ? (
                  <Image src={collection.bannerUrl} alt={collection.name} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400 text-xs">
                    No Banner
                  </div>
                )}
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
                <div className="absolute top-3 right-3">
                  <span className={cn(
                    "px-2 py-1 text-[8px] uppercase tracking-wider rounded-full font-medium backdrop-blur-md",
                    collection.status === 'active' ? "bg-emerald-500/90 text-white" :
                    collection.status === 'scheduled' ? "bg-amber-500/90 text-white" :
                    "bg-white/90 text-gray-600"
                  )}>
                    {collection.status}
                  </span>
                </div>
              </div>
              
              <div className="p-4 flex-1 flex flex-col">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium text-ink truncate pr-2">{collection.name}</h3>
                  <button className="p-1 text-gray-400 hover:text-ink hover:bg-gray-100 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreHorizontal size={14} />
                  </button>
                </div>
                
                <div className="mt-auto space-y-2">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Tag size={12} />
                    <span>{collection.type}</span>
                    <span className="text-gray-300">•</span>
                    <span className="font-medium text-ink">{collection.productCount} items</span>
                  </div>
                  
                  {(collection.startDate || collection.endDate) && (
                    <div className="flex items-center gap-2 text-[10px] text-gray-400">
                      <Calendar size={12} />
                      <span>
                        {collection.startDate ? new Date(collection.startDate).toLocaleDateString() : 'Now'} - {collection.endDate ? new Date(collection.endDate).toLocaleDateString() : 'Ongoing'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

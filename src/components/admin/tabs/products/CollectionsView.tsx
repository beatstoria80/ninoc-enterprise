"use client";

import React, { useState, useEffect } from 'react';
import { Plus, MoreHorizontal, Calendar, Tag, Search, Edit2, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { Collection } from '../../types';
import { CollectionSettingsDrawer } from './CollectionSettingsDrawer';

export function CollectionsView() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);

  const isVideoUrl = (url: string | null | undefined) => {
    if (!url) return false;
    return url.match(/\.(mp4|webm|ogg|mov)$/i) !== null;
  };

  const fetchCollections = async () => {
    setIsLoading(true);
    try {
      // We also need product count, but for simplicity we'll just fetch collections
      // In a real app we'd do a join or count query, but since it's a small app:
      const { data: cols } = await supabase.from('collections').select('*, collection_products(count)').order('created_at', { ascending: false });
      if (cols) {
        // Map the count
        const mapped = cols.map(c => ({
          ...c,
          products_count: c.collection_products?.[0]?.count || 0
        }));
        setCollections(mapped as any);
      }
    } catch (error) {
      console.error('Failed to fetch collections', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCollections();
  }, []);

  const openCreateDrawer = () => {
    setSelectedCollection(null);
    setIsDrawerOpen(true);
  };

  const openEditDrawer = (collection: Collection) => {
    setSelectedCollection(collection);
    setIsDrawerOpen(true);
  };

  const handleDelete = async (e: React.MouseEvent, collection: Collection) => {
    e.stopPropagation();
    if (!window.confirm(`Apakah Anda yakin ingin menghapus campaign "${collection.name}"?`)) return;
    
    setIsLoading(true);
    try {
      await supabase.from('collection_products').delete().eq('collection_id', collection.id);
      const { error } = await supabase.from('collections').delete().eq('id', collection.id);
      if (error) throw error;
      fetchCollections();
    } catch (error) {
      console.error('Failed to delete', error);
      alert('Gagal menghapus campaign');
      setIsLoading(false);
    }
  };

  const filtered = collections.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search collections..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-white border border-gray-200 rounded text-sm focus:outline-none focus:border-rose/50"
          />
        </div>
        <button 
          onClick={openCreateDrawer}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-ink text-white rounded hover:bg-ink/90 transition-colors"
        >
          <Plus size={12} />
          <span className="text-xs md:text-[9px] uppercase tracking-wider">Create Collection</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto minimal-scroll pb-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-64 text-sm text-gray-400">Loading collections...</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center border-2 border-dashed border-gray-200 rounded-xl">
            <p className="text-sm font-medium text-ink mb-1">No collections found</p>
            <p className="text-xs text-gray-400 mb-4">Create your first marketing collection.</p>
            <button onClick={openCreateDrawer} className="text-xs text-rose font-medium hover:underline">
              + Create New
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((collection: any) => (
              <div 
                key={collection.id} 
                onClick={() => openEditDrawer(collection)}
                className="bg-white rounded-xl border border-gray-100 overflow-hidden group hover:border-gray-200 hover:shadow-md transition-all cursor-pointer flex flex-col"
              >
                <div className="h-32 bg-gray-50 relative">
                  {collection.banner_url ? (
                    isVideoUrl(collection.banner_url) ? (
                      <video src={collection.banner_url} className="w-full h-full object-cover" autoPlay muted loop playsInline />
                    ) : (
                      <Image src={collection.banner_url} alt={collection.name} fill className="object-cover" />
                    )
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400 text-xs">
                      No Banner
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
                  <div className="absolute top-3 right-3 flex items-center gap-2">
                    <span className={cn(
                      "px-2 py-1 text-[11px] md:text-[8px] uppercase tracking-wider rounded-full font-medium backdrop-blur-md",
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
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="p-1 text-gray-400 hover:text-ink hover:bg-gray-100 rounded transition-colors" title="Edit">
                        <Edit2 size={12} />
                      </div>
                      <div 
                        className="p-1 text-gray-400 hover:text-rose hover:bg-rose/10 rounded transition-colors" 
                        title="Delete"
                        onClick={(e) => handleDelete(e, collection)}
                      >
                        <Trash2 size={12} />
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-auto space-y-2">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Tag size={12} />
                      <span className="capitalize">{collection.collection_type}</span>
                      <span className="text-gray-300">•</span>
                      <span className="font-medium text-ink">{collection.products_count || 0} items</span>
                    </div>
                    
                    {(collection.start_date || collection.end_date) && (
                      <div className="flex items-center gap-2 text-xs md:text-[10px] text-gray-400">
                        <Calendar size={12} />
                        <span>
                          {collection.start_date ? new Date(collection.start_date).toLocaleDateString() : 'Now'} - {collection.end_date ? new Date(collection.end_date).toLocaleDateString() : 'Ongoing'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <CollectionSettingsDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        collection={selectedCollection}
        onSaved={fetchCollections}
      />
    </div>
  );
}

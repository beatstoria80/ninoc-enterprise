import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, BookOpen, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';

interface LogbookEntry {
  id: string;
  entry_id: string;
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  excerpt_en?: string;
  content: string;
  content_en?: string;
  published_date: string;
  title_en?: string;
}

export function LogbookTab() {
  const [entries, setEntries] = useState<LogbookEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    entry_id: '',
    title: '',
    slug: '',
    category: '',
    excerpt: '',
    excerpt_en: '',
    content: '',
    content_en: '',
    title_en: '',
    published_date: format(new Date(), 'yyyy-MM-dd')
  });

  const fetchEntries = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('logbook_entries')
        .select('*')
        .order('published_date', { ascending: false });

      if (fetchError) throw fetchError;
      setEntries(data || []);
    } catch (err: any) {
      console.error('Error fetching logbook entries:', err);
      if (err.code === '42P01') {
        setError('Table "logbook_entries" does not exist. Please run the SQL migration script in your Supabase dashboard.');
      } else {
        setError(err.message || 'Failed to fetch entries.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      fetchEntries();
    });
  }, [fetchEntries]);

  const handleTitleChange = (title: string) => {
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    setFormData(prev => ({ ...prev, title, slug }));
  };

  const openCreateModal = () => {
    setIsEditMode(false);
    setEditingId(null);
    setFormData({
      entry_id: '',
      title: '',
      slug: '',
      category: 'GARMENT STUDY',
      excerpt: '',
      excerpt_en: '',
      content: '',
      content_en: '',
      title_en: '',
      published_date: format(new Date(), 'yyyy-MM-dd')
    });
    // Generate next sequential entry_id
    const fetchNextEntryId = async () => {
      const { data } = await supabase
        .from('logbook_entries')
        .select('entry_id')
        .order('created_at', { ascending: false })
        .limit(1);
      let nextNum = 1;
      if (data && data.length > 0) {
        const last = data[0].entry_id;
        const match = last.match(/^L-(\d+)$/);
        if (match) nextNum = parseInt(match[1], 10) + 1;
      }
      setFormData(prev => ({ ...prev, entry_id: `L-${nextNum.toString().padStart(3, '0')}` }));
    };
    fetchNextEntryId();
    setIsModalOpen(true);
  };

  const openEditModal = (entry: LogbookEntry) => {
    setIsEditMode(true);
    setEditingId(entry.id);
    setFormData({
      entry_id: entry.entry_id,
      title: entry.title,
      slug: entry.slug,
      category: entry.category,
      excerpt: entry.excerpt || '',
      excerpt_en: entry.excerpt_en || '',
      content: entry.content || '',
      content_en: entry.content_en || '',
      title_en: entry.title_en || '',
      published_date: entry.published_date
    });
    setIsModalOpen(true);
  };

  const saveEntry = async () => {
    try {
      if (isEditMode && editingId) {
        const { error } = await supabase
          .from('logbook_entries')
          .update(formData)
          .eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('logbook_entries')
          .insert([formData]);
        if (error) throw error;
      }
      setIsModalOpen(false);
      fetchEntries();
    } catch (err: any) {
      alert(`Error saving entry: ${err.message}`);
    }
  };

  const deleteEntry = async (id: string) => {
    if (!confirm('Are you sure you want to delete this logbook entry?')) return;
    try {
      const { error } = await supabase
        .from('logbook_entries')
        .delete()
        .eq('id', id);
      if (error) throw error;
      fetchEntries();
    } catch (err: any) {
      alert(`Error deleting entry: ${err.message}`);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div>
          <h2 className="text-xl font-display font-medium italic text-ink uppercase tracking-tight">Studio Logbook</h2>
          <p className="text-xs md:text-[10px] text-ink/40 uppercase tracking-widest mt-1">Manage archival records and process notes</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-ink text-white px-4 py-2 hover:bg-rose transition-colors"
        >
          <Plus size={14} />
          <span className="text-xs md:text-[9px] font-medium uppercase tracking-[0.2em]">New Entry</span>
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-rose/5 border border-rose/20 p-4 mb-6 flex items-start gap-3">
          <AlertTriangle size={16} className="text-rose shrink-0 mt-0.5" />
          <div>
            <h3 className="text-xs md:text-[10px] font-medium uppercase tracking-widest text-rose mb-1">Database Error</h3>
            <p className="text-sm md:text-[11px] text-ink/60 font-mono leading-relaxed">{error}</p>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto minimal-scroll bg-white border border-ink/5 relative">
        {isLoading ? (
          <div className="p-12 flex justify-center">
            <div className="w-5 h-5 border-2 border-ink/20 border-t-ink rounded-full animate-spin" />
          </div>
        ) : entries.length === 0 && !error ? (
          <div className="p-12 text-center flex flex-col items-center">
            <BookOpen size={24} className="text-ink/20 mb-4" />
            <p className="text-xs md:text-[10px] uppercase tracking-widest text-ink/40">No entries found</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-ink/[0.02] sticky top-0 z-10 backdrop-blur-md">
              <tr>
                <th className="px-4 py-3 text-xs md:text-[9px] font-medium uppercase tracking-widest text-ink/40 border-b border-ink/5">ID</th>
                <th className="px-4 py-3 text-xs md:text-[9px] font-medium uppercase tracking-widest text-ink/40 border-b border-ink/5">Date</th>
                <th className="px-4 py-3 text-xs md:text-[9px] font-medium uppercase tracking-widest text-ink/40 border-b border-ink/5">Category</th>
                <th className="px-4 py-3 text-xs md:text-[9px] font-medium uppercase tracking-widest text-ink/40 border-b border-ink/5">Title</th>
                <th className="px-4 py-3 text-xs md:text-[9px] font-medium uppercase tracking-widest text-ink/40 border-b border-ink/5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <motion.tr 
                  key={entry.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border-b border-ink/5 hover:bg-ink/[0.02] transition-colors group"
                >
                  <td className="px-4 py-4 align-top w-24">
                    <span className="text-xs md:text-[9px] font-mono tracking-tighter text-ink bg-ink/5 px-1 py-0.5">{entry.entry_id}</span>
                  </td>
                  <td className="px-4 py-4 align-top w-32">
                    <span className="text-xs md:text-[10px] font-medium text-ink/60">{entry.published_date}</span>
                  </td>
                  <td className="px-4 py-4 align-top w-40">
                    <span className="text-xs md:text-[9px] font-medium uppercase tracking-[0.2em] text-rose">{entry.category}</span>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <div className="font-display italic font-medium text-ink uppercase mb-1">{entry.title}</div>
                    <div className="text-xs md:text-[10px] text-ink/50 line-clamp-2 leading-relaxed">{entry.excerpt}</div>
                  </td>
                  <td className="px-4 py-4 align-top text-right w-24">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEditModal(entry)} className="p-1.5 text-ink/40 hover:text-ink hover:bg-ink/5 transition-colors">
                        <Edit2 size={12} />
                      </button>
                      <button onClick={() => deleteEntry(entry.id)} className="p-1.5 text-ink/40 hover:text-rose hover:bg-rose/5 transition-colors">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-ink/20 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-2xl shadow-2xl relative flex flex-col max-h-[90vh]"
          >
            <div className="p-6 border-b border-ink/5 flex items-center justify-between">
              <div>
                <h3 className="font-display font-medium italic text-lg uppercase tracking-tight text-ink">
                  {isEditMode ? 'Edit Entry' : 'New Entry'}
                </h3>
                <p className="text-xs md:text-[9px] font-medium uppercase tracking-widest text-ink/40 mt-1">Archival Logbook</p>
              </div>
            </div>

            <div className="p-6 overflow-y-auto minimal-scroll space-y-5">
              <div className="flex gap-4">
                <div className="flex-1 space-y-1.5">
                  <label className="text-xs md:text-[9px] font-medium uppercase tracking-widest text-ink/40">Entry ID</label>
                  <input
                    type="text"
                    value={formData.entry_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, entry_id: e.target.value }))}
                    className="w-full bg-white border border-ink/10 px-3 py-2 text-sm md:text-[11px] font-mono outline-none focus:border-rose/50"
                  />
                </div>
                <div className="flex-1 space-y-1.5">
                  <label className="text-xs md:text-[9px] font-medium uppercase tracking-widest text-ink/40">Date</label>
                  <input
                    type="date"
                    value={formData.published_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, published_date: e.target.value }))}
                    className="w-full bg-white border border-ink/10 px-3 py-2 text-sm md:text-[11px] outline-none focus:border-rose/50"
                  />
                </div>
                <div className="flex-1 space-y-1.5">
                  <label className="text-xs md:text-[9px] font-medium uppercase tracking-widest text-ink/40">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full bg-white border border-ink/10 px-3 py-2 text-sm md:text-[11px] font-medium outline-none focus:border-rose/50"
                  >
                    <option value="GARMENT STUDY">Garment Study</option>
                    <option value="BEHIND THE SEAMS">Behind The Seams</option>
                    <option value="MANIFESTO">Manifesto</option>
                    <option value="PROCESS">Process</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs md:text-[9px] font-medium uppercase tracking-widest text-ink/40">Title (ID)</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="w-full bg-white border border-ink/10 px-3 py-2 text-[12px] font-medium outline-none focus:border-rose/50"
                  placeholder="The Anatomy of the Perfect Drape"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs md:text-[9px] font-medium uppercase tracking-widest text-ink/40">Title (EN)</label>
                <input
                  type="text"
                  value={formData.title_en || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, title_en: e.target.value }))}
                  className="w-full bg-white border border-ink/10 px-3 py-2 text-[12px] font-medium outline-none focus:border-rose/50"
                  placeholder="The Anatomy of the Perfect Drape (English)"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs md:text-[9px] font-medium uppercase tracking-widest text-ink/40">Slug</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  className="w-full bg-ink/5 border border-transparent px-3 py-2 text-sm md:text-[11px] font-mono text-ink/50 outline-none"
                  readOnly
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs md:text-[9px] font-medium uppercase tracking-widest text-ink/40">Excerpt (ID)</label>
                <textarea
                  value={formData.excerpt}
                  onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                  rows={2}
                  className="w-full bg-white border border-ink/10 px-3 py-2 text-sm md:text-[11px] leading-relaxed outline-none focus:border-rose/50 resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs md:text-[9px] font-medium uppercase tracking-widest text-ink/40">Excerpt (EN)</label>
                <textarea
                  value={formData.excerpt_en || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, excerpt_en: e.target.value }))}
                  rows={2}
                  className="w-full bg-white border border-ink/10 px-3 py-2 text-sm md:text-[11px] leading-relaxed outline-none focus:border-rose/50 resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs md:text-[9px] font-medium uppercase tracking-widest text-ink/40">Full Content (ID)</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  rows={6}
                  className="w-full bg-white border border-ink/10 px-3 py-2 text-sm md:text-[11px] leading-relaxed outline-none focus:border-rose/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs md:text-[9px] font-medium uppercase tracking-widest text-ink/40">Full Content (EN)</label>
                <textarea
                  value={formData.content_en || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, content_en: e.target.value }))}
                  rows={6}
                  className="w-full bg-white border border-ink/10 px-3 py-2 text-sm md:text-[11px] leading-relaxed outline-none focus:border-rose/50"
                />
              </div>
            </div>

            <div className="p-4 border-t border-ink/5 flex items-center justify-end gap-3 bg-ink/[0.02]">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-xs md:text-[10px] font-medium uppercase tracking-[0.2em] text-ink/60 hover:text-ink"
              >
                Cancel
              </button>
              <button 
                onClick={saveEntry}
                className="bg-ink text-white px-6 py-2 text-xs md:text-[10px] font-medium uppercase tracking-[0.2em] hover:bg-rose transition-colors"
              >
                {isEditMode ? 'Save Changes' : 'Create Entry'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

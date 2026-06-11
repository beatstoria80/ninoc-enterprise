"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RefreshCw, Plus, Search, X, Edit2, Trash2, ToggleLeft, ToggleRight,
  ChevronDown, MessageSquare, Tag, GripVertical, Save, Copy, Check
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlaceholderConfig {
  id: string;
  label: string;
  content: string;
  category: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const CATEGORIES = [
  { id: 'greeting', label: 'Greeting', color: 'bg-emerald-50 text-emerald-600' },
  { id: 'return', label: 'Retur', color: 'bg-rose/10 text-rose' },
  { id: 'shipping', label: 'Shipping', color: 'bg-blue-50 text-blue-600' },
  { id: 'payment', label: 'Payment', color: 'bg-purple-50 text-purple-600' },
  { id: 'closing', label: 'Closing', color: 'bg-amber-50 text-amber-600' },
  { id: 'general', label: 'General', color: 'bg-gray-50 text-gray-600' },
];

const EASING = { out: [0.23, 1, 0.32, 1] } as const;
const DURATION = { fast: 0.15, normal: 0.2, medium: 0.3 } as const;

const categoryColorMap: Record<string, string> = {
  greeting: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  return: 'bg-rose/10 text-rose border-rose/10',
  shipping: 'bg-blue-50 text-blue-600 border-blue-100',
  payment: 'bg-purple-50 text-purple-600 border-purple-100',
  closing: 'bg-amber-50 text-amber-600 border-amber-100',
  general: 'bg-gray-50 text-gray-500 border-gray-100',
};

function PressScale({ children, onClick, className }: { children: React.ReactNode; onClick?: () => void; className?: string }) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={cn("transition-all duration-200", className)}
    >
      {children}
    </motion.button>
  );
}

export function PlaceholderTab() {
  const [placeholders, setPlaceholders] = useState<PlaceholderConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [editModal, setEditModal] = useState<PlaceholderConfig | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [form, setForm] = useState({ label: '', content: '', category: 'general', sort_order: 0 });
  const [saving, setSaving] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  const fetchPlaceholders = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/placeholders');
      const data = await res.json();
      if (data.placeholders) setPlaceholders(data.placeholders);
    } catch (err) {
      console.error('[PlaceholderTab] fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => { fetchPlaceholders(); });
  }, [fetchPlaceholders]);

  const filtered = placeholders.filter(p => {
    const matchSearch = !search || p.label.toLowerCase().includes(search.toLowerCase()) || p.content.toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCategory === 'all' || p.category === activeCategory;
    return matchSearch && matchCat;
  });

  const grouped = CATEGORIES.reduce((acc, cat) => {
    acc[cat.id] = filtered.filter(p => p.category === cat.id);
    return acc;
  }, {} as Record<string, PlaceholderConfig[]>);

  const counts = CATEGORIES.reduce((acc, cat) => {
    acc[cat.id] = placeholders.filter(p => p.category === cat.id && p.is_active).length;
    return acc;
  }, { all: placeholders.filter(p => p.is_active).length } as Record<string, number>);

  const savePlaceholder = async () => {
    if (!form.label.trim() || !form.content.trim()) return;
    setSaving(true);
    try {
      if (editModal) {
        await fetch(`/api/placeholders/${editModal.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
      } else {
        await fetch('/api/placeholders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
      }
      await fetchPlaceholders();
      setEditModal(null);
      setIsCreateOpen(false);
      setForm({ label: '', content: '', category: 'general', sort_order: 0 });
    } catch (err) {
      console.error('[savePlaceholder]', err);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (p: PlaceholderConfig) => {
    try {
      await fetch(`/api/placeholders/${p.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !p.is_active }),
      });
      await fetchPlaceholders();
    } catch (err) {
      console.error('[toggleActive]', err);
    }
  };

  const deletePlaceholder = async (id: string) => {
    try {
      await fetch(`/api/placeholders/${id}`, { method: 'DELETE' });
      await fetchPlaceholders();
      setDeleteId(null);
    } catch (err) {
      console.error('[deletePlaceholder]', err);
    }
  };

  const copyContent = (p: PlaceholderConfig) => {
    navigator.clipboard.writeText(p.content).then(() => {
      setCopiedId(p.id);
      setTimeout(() => setCopiedId(null), 1500);
    });
  };

  const openEdit = (p: PlaceholderConfig) => {
    setForm({ label: p.label, content: p.content, category: p.category, sort_order: p.sort_order });
    setEditModal(p);
    setIsCreateOpen(false);
  };

  const openCreate = () => {
    setForm({ label: '', content: '', category: 'general', sort_order: 0 });
    setEditModal(null);
    setIsCreateOpen(true);
  };

  const charCount = form.content.length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div>
          <h2 className="text-xl font-display italic font-medium uppercase tracking-tight text-ink">Placeholder</h2>
          <p className="text-xs md:text-[10px] text-ink/40 uppercase tracking-widest mt-1">
            Quick-reply templates for Support Chat
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-ink text-white text-xs md:text-[9px] font-semibold uppercase tracking-wider rounded-sm hover:bg-rose transition-colors duration-200"
        >
          <Plus size={10} strokeWidth={2.5} />
          New Template
        </motion.button>
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-1 mb-3 overflow-x-auto no-scrollbar shrink-0">
        <button
          onClick={() => setActiveCategory('all')}
          className={cn(
            "px-3 py-1.5 text-xs md:text-[9px] font-semibold uppercase tracking-wider rounded-sm whitespace-nowrap transition-colors",
            activeCategory === 'all'
              ? "bg-ink text-white"
              : "bg-ink/5 text-ink/50 hover:bg-ink/10"
          )}
        >
          All
          <span className={cn("ml-1.5 px-1 py-0.5 text-[10px] md:text-[7px] rounded-sm", activeCategory === 'all' ? "bg-white/20" : "bg-rose/10 text-rose")}>
            {counts.all}
          </span>
        </button>
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={cn(
              "px-3 py-1.5 text-xs md:text-[9px] font-semibold uppercase tracking-wider rounded-sm whitespace-nowrap transition-colors",
              activeCategory === cat.id
                ? "bg-ink text-white"
                : "bg-ink/5 text-ink/50 hover:bg-ink/10"
            )}
          >
            {cat.label}
            {counts[cat.id] > 0 && (
              <span className={cn("ml-1.5 px-1 py-0.5 text-[10px] md:text-[7px] rounded-sm", activeCategory === cat.id ? "bg-white/20" : "bg-rose/10 text-rose")}>
                {counts[cat.id]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-3 shrink-0">
        <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search templates..."
          className="w-full pl-9 pr-4 py-2 bg-white border border-ink/10 text-sm md:text-[11px] focus:outline-none focus:border-rose/40 transition-colors placeholder:text-ink/20 rounded-sm"
        />
      </div>

      {/* Template List */}
      <div className="flex-1 overflow-y-auto minimal-scroll">
        {isLoading ? (
          <div className="p-12 flex justify-center">
            <div className="w-5 h-5 border-2 border-ink/20 border-t-ink rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <MessageSquare size={24} className="text-ink/20 mx-auto mb-3" strokeWidth={1} />
            <p className="text-xs md:text-[10px] uppercase tracking-widest text-ink/40">No templates found</p>
          </div>
        ) : (
          <div className="space-y-5">
            {activeCategory === 'all' ? (
              // Group by category
              CATEGORIES.filter(cat => grouped[cat.id]?.length > 0).map(cat => (
                <div key={cat.id} className="space-y-1.5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={cn("px-2 py-0.5 text-[10px] md:text-[7px] font-bold uppercase tracking-widest rounded-sm border", cat.color)}>
                      {cat.label}
                    </span>
                    <span className="text-[11px] md:text-[8px] text-ink/20 font-medium">{grouped[cat.id].length} template{grouped[cat.id].length !== 1 ? 's' : ''}</span>
                  </div>
                  {grouped[cat.id].map(p => (
                    <TemplateCard
                      key={p.id}
                      placeholder={p}
                      onEdit={() => openEdit(p)}
                      onToggle={() => toggleActive(p)}
                      onDelete={() => setDeleteId(p.id)}
                      onCopy={() => copyContent(p)}
                      copied={copiedId === p.id}
                    />
                  ))}
                </div>
              ))
            ) : (
              filtered.map(p => (
                <TemplateCard
                  key={p.id}
                  placeholder={p}
                  onEdit={() => openEdit(p)}
                  onToggle={() => toggleActive(p)}
                  onDelete={() => setDeleteId(p.id)}
                  onCopy={() => copyContent(p)}
                  copied={copiedId === p.id}
                />
              ))
            )}
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <AnimatePresence>
        {isCreateOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-ink/20 backdrop-blur-sm"
              onClick={() => { setIsCreateOpen(false); setEditModal(null); }}
            />
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ duration: 0.2, ease: EASING.out }}
              className="relative bg-white w-full max-w-md rounded-sm shadow-2xl overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-ink/5 flex items-center justify-between bg-ink/[0.01]">
                <div>
                  <p className="text-[10px] md:text-[7px] font-semibold uppercase tracking-widest text-ink/30">Support Chat</p>
                  <h3 className="text-sm md:text-[11px] font-semibold uppercase tracking-widest text-ink mt-0.5">New Template</h3>
                </div>
                <button onClick={() => { setIsCreateOpen(false); setEditModal(null); }} className="text-ink/30 hover:text-rose">
                  <X size={14} />
                </button>
              </div>
              <div className="p-5 space-y-4">
                {/* Label */}
                <div className="space-y-1.5">
                  <label className="text-[10px] md:text-[7px] font-semibold uppercase tracking-widest text-ink/35">Label</label>
                  <input
                    type="text"
                    value={form.label}
                    onChange={e => setForm({ ...form, label: e.target.value })}
                    placeholder="e.g. Salam Hangat"
                    className="w-full px-3 py-2.5 border border-ink/10 text-sm md:text-[11px] font-medium outline-none focus:border-rose/40 transition-colors placeholder:text-ink/15 rounded-sm"
                  />
                </div>
                {/* Category */}
                <div className="space-y-1.5">
                  <label className="text-[10px] md:text-[7px] font-semibold uppercase tracking-widest text-ink/35">Category</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setForm({ ...form, category: cat.id })}
                        className={cn(
                          "py-1.5 rounded-sm text-[11px] md:text-[8px] font-semibold uppercase tracking-wider border transition-all duration-150",
                          form.category === cat.id
                            ? "bg-ink text-white border-ink"
                            : "bg-white text-ink/40 border-ink/5 hover:border-ink/20"
                        )}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Content */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] md:text-[7px] font-semibold uppercase tracking-widest text-ink/35">Message Content</label>
                    <span className={cn("text-[10px] md:text-[7px] font-medium tracking-widest uppercase", charCount > 400 ? "text-rose" : "text-ink/20")}>
                      {charCount}/500
                    </span>
                  </div>
                  <textarea
                    value={form.content}
                    onChange={e => {
                      if (e.target.value.length <= 500) setForm({ ...form, content: e.target.value });
                    }}
                    placeholder="Isi pesan template..."
                    rows={5}
                    className="w-full px-3 py-2.5 border border-ink/10 text-sm md:text-[11px] font-medium outline-none focus:border-rose/40 transition-colors placeholder:text-ink/15 rounded-sm resize-none leading-relaxed"
                  />
                </div>
              </div>
              <div className="px-5 py-4 border-t border-ink/5 flex items-center justify-end gap-2 bg-ink/[0.01]">
                <button
                  onClick={() => { setIsCreateOpen(false); setEditModal(null); }}
                  className="px-4 py-2 text-xs md:text-[10px] font-medium uppercase tracking-wider text-ink/50 hover:text-ink hover:bg-ink/5 rounded-sm transition-all"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={savePlaceholder}
                  disabled={saving || !form.label.trim() || !form.content.trim()}
                  className="px-5 py-2 text-xs md:text-[10px] font-semibold uppercase tracking-wider bg-ink text-white hover:bg-rose rounded-sm transition-colors disabled:opacity-40 flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={10} /> Save Template
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Modal (same as create but with edit state) */}
      <AnimatePresence>
        {editModal && !isCreateOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-ink/20 backdrop-blur-sm"
              onClick={() => { setEditModal(null); }}
            />
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ duration: 0.2, ease: EASING.out }}
              className="relative bg-white w-full max-w-md rounded-sm shadow-2xl overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-ink/5 flex items-center justify-between bg-ink/[0.01]">
                <div>
                  <p className="text-[10px] md:text-[7px] font-semibold uppercase tracking-widest text-ink/30">Support Chat</p>
                  <h3 className="text-sm md:text-[11px] font-semibold uppercase tracking-widest text-ink mt-0.5">Edit Template</h3>
                </div>
                <button onClick={() => setEditModal(null)} className="text-ink/30 hover:text-rose">
                  <X size={14} />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] md:text-[7px] font-semibold uppercase tracking-widest text-ink/35">Label</label>
                  <input
                    type="text"
                    value={form.label}
                    onChange={e => setForm({ ...form, label: e.target.value })}
                    className="w-full px-3 py-2.5 border border-ink/10 text-sm md:text-[11px] font-medium outline-none focus:border-rose/40 transition-colors placeholder:text-ink/15 rounded-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] md:text-[7px] font-semibold uppercase tracking-widest text-ink/35">Category</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setForm({ ...form, category: cat.id })}
                        className={cn(
                          "py-1.5 rounded-sm text-[11px] md:text-[8px] font-semibold uppercase tracking-wider border transition-all duration-150",
                          form.category === cat.id
                            ? "bg-ink text-white border-ink"
                            : "bg-white text-ink/40 border-ink/5 hover:border-ink/20"
                        )}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] md:text-[7px] font-semibold uppercase tracking-widest text-ink/35">Message Content</label>
                    <span className={cn("text-[10px] md:text-[7px] font-medium tracking-widest uppercase", charCount > 400 ? "text-rose" : "text-ink/20")}>
                      {charCount}/500
                    </span>
                  </div>
                  <textarea
                    value={form.content}
                    onChange={e => {
                      if (e.target.value.length <= 500) setForm({ ...form, content: e.target.value });
                    }}
                    rows={5}
                    className="w-full px-3 py-2.5 border border-ink/10 text-sm md:text-[11px] font-medium outline-none focus:border-rose/40 transition-colors placeholder:text-ink/15 rounded-sm resize-none leading-relaxed"
                  />
                </div>
              </div>
              <div className="px-5 py-4 border-t border-ink/5 flex items-center justify-end gap-2 bg-ink/[0.01]">
                <button onClick={() => setEditModal(null)} className="px-4 py-2 text-xs md:text-[10px] font-medium uppercase tracking-wider text-ink/50 hover:text-ink hover:bg-ink/5 rounded-sm transition-all">
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={savePlaceholder}
                  disabled={saving || !form.label.trim() || !form.content.trim()}
                  className="px-5 py-2 text-xs md:text-[10px] font-semibold uppercase tracking-wider bg-ink text-white hover:bg-rose rounded-sm transition-colors disabled:opacity-40 flex items-center gap-2"
                >
                  {saving ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={10} />}
                  {saving ? 'Saving...' : 'Update'}
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteId && (
          <div className="fixed inset-0 z-[210] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-ink/20 backdrop-blur-sm"
              onClick={() => setDeleteId(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white w-full max-w-xs rounded-sm shadow-2xl overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-ink/5">
                <h3 className="text-sm md:text-[11px] font-semibold uppercase tracking-widest text-ink">Delete Template</h3>
              </div>
              <div className="p-5">
                <p className="text-sm md:text-[11px] text-ink/60 leading-relaxed">
                  Are you sure you want to delete this template? This action cannot be undone.
                </p>
              </div>
              <div className="px-5 py-4 border-t border-ink/5 flex items-center justify-end gap-2">
                <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-xs md:text-[10px] font-medium uppercase tracking-wider text-ink/50 hover:text-ink rounded-sm">Cancel</button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => deletePlaceholder(deleteId)}
                  className="px-4 py-2 text-xs md:text-[10px] font-semibold uppercase tracking-wider bg-red-500 text-white hover:bg-red-600 rounded-sm flex items-center gap-1.5"
                >
                  <Trash2 size={9} /> Delete
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TemplateCard({
  placeholder,
  onEdit,
  onToggle,
  onDelete,
  onCopy,
  copied
}: {
  placeholder: PlaceholderConfig;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
  onCopy: () => void;
  copied: boolean;
}) {
  const catConfig = CATEGORIES.find(c => c.id === placeholder.category);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      className={cn(
        "bg-white border rounded-sm p-4 group transition-all duration-200",
        placeholder.is_active
          ? "border-ink/5 hover:border-ink/10 hover:shadow-sm"
          : "border-ink/5 opacity-50 bg-ink/[0.01]"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            {catConfig && (
              <span className={cn("px-1.5 py-0.5 text-[6px] font-bold uppercase tracking-widest rounded-sm border", categoryColorMap[placeholder.category])}>
                {catConfig.label}
              </span>
            )}
            {!placeholder.is_active && (
              <span className="px-1.5 py-0.5 text-[6px] font-bold uppercase tracking-widest rounded-sm bg-gray-100 text-gray-400 border border-gray-200">
                Inactive
              </span>
            )}
          </div>
          <h4 className="text-xs md:text-[10px] font-semibold text-ink uppercase tracking-wider truncate">{placeholder.label}</h4>
          <p className="text-xs md:text-[9px] text-ink/40 mt-1 leading-relaxed line-clamp-2">{placeholder.content}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={onCopy}
            className="p-1.5 text-ink/30 hover:text-ink transition-colors"
            title="Copy content"
          >
            {copied ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
          </button>
          <button
            onClick={onEdit}
            className="p-1.5 text-ink/30 hover:text-rose transition-colors"
            title="Edit"
          >
            <Edit2 size={11} />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 text-ink/30 hover:text-red-500 transition-colors"
            title="Delete"
          >
            <Trash2 size={11} />
          </button>
          <button
            onClick={onToggle}
            className="p-1.5 transition-colors"
            title={placeholder.is_active ? 'Deactivate' : 'Activate'}
          >
            {placeholder.is_active ? (
              <ToggleRight size={14} className="text-emerald-500" />
            ) : (
              <ToggleLeft size={14} className="text-ink/20" />
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
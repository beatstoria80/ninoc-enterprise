import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Folder, Plus, Edit2, Trash2, X, Search, Save } from 'lucide-react';
import { cn } from '@/lib/utils';

export function CategoriesView() {
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);

  // Form State
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [seoKeywords, setSeoKeywords] = useState('');
  const [seoTemplate, setSeoTemplate] = useState('{name} | NINOC');

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    queueMicrotask(() => {
      fetchCategories();
    });
  }, []);

  const openModal = (cat: any = null) => {
    if (cat) {
      setEditingCategory(cat);
      setName(cat.name);
      setSlug(cat.slug);
      setSeoKeywords(cat.seo_keywords ? cat.seo_keywords.join(', ') : '');
      setSeoTemplate(cat.seo_title_template || '{name} | NINOC');
    } else {
      setEditingCategory(null);
      setName('');
      setSlug('');
      setSeoKeywords('');
      setSeoTemplate('{name} | NINOC');
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    const payload = {
      id: editingCategory?.id,
      name,
      slug,
      seo_keywords: seoKeywords.split(',').map(k => k.trim()).filter(Boolean),
      seo_title_template: seoTemplate
    };

    const method = editingCategory ? 'PUT' : 'POST';
    
    try {
      const res = await fetch('/api/admin/categories', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setIsModalOpen(false);
        fetchCategories();
      } else {
        alert('Failed to save category');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      const res = await fetch(`/api/admin/categories?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchCategories();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-2 relative">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-medium text-ink">Category & SEO Hierarchy</h3>
          <p className="text-[10px] text-gray-500">Manage categories and their Dynamic SEO Keywords.</p>
        </div>
        <button onClick={() => openModal()} className="flex items-center gap-1.5 px-3 py-1.5 bg-ink text-white rounded hover:bg-ink/90 transition-colors">
          <Plus size={12} />
          <span className="text-[9px] uppercase tracking-wider">New Category</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto minimal-scroll bg-white border border-gray-100 rounded-xl p-2">
        {isLoading ? (
          <div className="p-4 text-center text-xs text-gray-500">Loading categories...</div>
        ) : categories.length === 0 ? (
          <div className="p-4 text-center text-xs text-gray-500">No categories found. Run the SQL migration to initialize database!</div>
        ) : (
          categories.map(cat => (
            <div key={cat.id} className="flex items-center justify-between py-2 px-3 hover:bg-gray-50 rounded-lg group transition-colors">
              <div className="flex items-center gap-2">
                <Folder size={14} className="text-rose" />
                <span className="text-xs font-medium text-ink">{cat.name}</span>
                <span className="text-[10px] text-gray-400 font-mono bg-gray-100 px-1.5 py-0.5 rounded">/{cat.slug}</span>
                {cat.seo_keywords && cat.seo_keywords.length > 0 && (
                   <span className="text-[9px] text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded flex items-center gap-1"><Search size={10}/> {cat.seo_keywords.length} Keywords</span>
                )}
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openModal(cat)} className="p-1.5 text-gray-400 hover:text-ink hover:bg-gray-100 rounded transition-colors" title="Edit">
                  <Edit2 size={12} />
                </button>
                <button onClick={() => handleDelete(cat.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors" title="Delete">
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-3"
          >
            <motion.div
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="flex items-center justify-between p-3 border-b border-gray-100">
                <h3 className="text-sm font-medium">{editingCategory ? 'Edit Category' : 'New Category'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-gray-100 rounded">
                  <X size={16} />
                </button>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-[10px] uppercase text-gray-500 mb-1">Category Name</label>
                  <input type="text" value={name} onChange={e => { setName(e.target.value); setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-')); }} className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded" placeholder="e.g. Sepatu" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-gray-500 mb-1">Slug URL</label>
                  <input type="text" value={slug} onChange={e => setSlug(e.target.value)} className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded" placeholder="sepatu" />
                </div>
                <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100 space-y-3">
                  <div className="flex items-center gap-2 text-blue-800 font-medium text-xs">
                    <Search size={14} /> Dynamic SEO Settings
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase text-gray-500 mb-1">Target Keywords (Comma Separated)</label>
                    <textarea value={seoKeywords} onChange={e => setSeoKeywords(e.target.value)} rows={2} className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded" placeholder="e.g. sepatu pria, sneakers, ori" />
                    <p className="text-[9px] text-gray-400 mt-1">SEO Helper will enforce these keywords when this category is selected.</p>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase text-gray-500 mb-1">Title Template Generator</label>
                    <input type="text" value={seoTemplate} onChange={e => setSeoTemplate(e.target.value)} className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded" placeholder="{name} | NINOC" />
                    <p className="text-[9px] text-gray-400 mt-1">Use {'{name}'} to represent the product name.</p>
                  </div>
                </div>
              </div>
              <div className="p-3 border-t border-gray-100 flex justify-end">
                <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-rose text-white rounded text-xs font-medium hover:bg-rose/90">
                  <Save size={14} /> Save Category
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

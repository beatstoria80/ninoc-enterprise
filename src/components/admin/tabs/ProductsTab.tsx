import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Product } from '../types';

// Import sub-views
import { AllProductsView } from './products/AllProductsView';
import { CategoriesView } from './products/CategoriesView';
import { CollectionsView } from './products/CollectionsView';
import { CatalogsView } from './products/CatalogsView';

type SubTabId = 'all' | 'categories' | 'collections' | 'catalogs';

export function ProductsTab({
  products,
  searchQuery,
  setSearchQuery,
  openProductModal,
  toggleFeatured,
  deleteProduct
}: {
  products: Product[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  openProductModal: (p?: Product) => void;
  toggleFeatured: (p: Product) => void;
  deleteProduct: (id: string) => void;
}) {
  const [activeSubTab, setActiveSubTab] = useState<SubTabId>('all');

  const subTabs = [
    { id: 'all', label: 'All Products' },
    { id: 'categories', label: 'Categories' },
    { id: 'collections', label: 'Collections' },
    { id: 'catalogs', label: 'Catalogs' }
  ];

  return (
    <motion.div
      key="products-main"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col h-full space-y-2"
    >
      {/* Header & Sub-navigation */}
      <div className="shrink-0 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-medium text-gray-900 uppercase tracking-wide">Products Management</h2>
          </div>
          {activeSubTab === 'all' && (
            <button
              onClick={() => openProductModal()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose text-white rounded hover:bg-rose/90 transition-colors"
            >
              <Plus size={12} />
              <span className="text-[9px] uppercase tracking-wider">Add Product</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 p-1 bg-gray-50/50 border border-gray-100 rounded-lg w-fit">
          {subTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as SubTabId)}
              className={cn(
                "px-3 py-1.5 text-[10px] uppercase tracking-wider font-medium rounded-md transition-all",
                activeSubTab === tab.id
                  ? "bg-white text-ink shadow-sm ring-1 ring-black/5"
                  : "text-gray-500 hover:text-ink hover:bg-black/5"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Render Active Sub-view */}
      <div className="flex-1 min-h-0 relative">
        <AnimatePresence mode="wait">
          {activeSubTab === 'all' && (
            <motion.div
              key="all"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.15 }}
              className="h-full absolute inset-0"
            >
              <AllProductsView 
                products={products}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                openProductModal={openProductModal}
                toggleFeatured={toggleFeatured}
                deleteProduct={deleteProduct}
              />
            </motion.div>
          )}

          {activeSubTab === 'categories' && (
            <motion.div
              key="categories"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.15 }}
              className="h-full absolute inset-0"
            >
              <CategoriesView />
            </motion.div>
          )}

          {activeSubTab === 'collections' && (
            <motion.div
              key="collections"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.15 }}
              className="h-full absolute inset-0"
            >
              <CollectionsView />
            </motion.div>
          )}

          {activeSubTab === 'catalogs' && (
            <motion.div
              key="catalogs"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.15 }}
              className="h-full absolute inset-0"
            >
              <CatalogsView />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

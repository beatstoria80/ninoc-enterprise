import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface FlashSaleForm {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

export function useFlashSaleManager() {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<FlashSaleForm>({
    id: '',
    title: '',
    start_time: '',
    end_time: '',
    is_active: false
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [salesRes, prodRes] = await Promise.all([
      supabase.from('flash_sales').select('*').order('created_at', { ascending: false }),
      supabase.from('products').select('id, name, price, badge_text, variants(id, size, color)')
    ]);
    
    if (salesRes.data) setSales(salesRes.data);
    if (prodRes.data) setProducts(prodRes.data);
    
    setLoading(false);
  }, []);

  const fetchItems = async (saleId: string) => {
    const { data } = await supabase
      .from('flash_sale_items')
      .select('*, products(name, price), variants(size, color)')
      .eq('flash_sale_id', saleId);
    if (data) setItems(data);
  };

  const openNewSale = () => {
    setIsEditing(false);
    setForm({ id: '', title: '', start_time: '', end_time: '', is_active: false });
    setItems([]);
    setIsModalOpen(true);
  };

  const openEditSale = async (sale: any) => {
    setIsEditing(true);
    setForm({
      id: sale.id,
      title: sale.title,
      start_time: new Date(sale.start_time).toISOString().slice(0, 16),
      end_time: new Date(sale.end_time).toISOString().slice(0, 16),
      is_active: sale.is_active
    });
    await fetchItems(sale.id);
    setIsModalOpen(true);
  };

  const saveSale = async () => {
    if (!form.title || !form.start_time || !form.end_time) {
      alert("Harap isi semua jadwal dan judul promo");
      return false;
    }
    
    let saleId = form.id;
    
    try {
      if (!isEditing) {
        const { data, error } = await supabase.from('flash_sales').insert({
          title: form.title,
          start_time: new Date(form.start_time).toISOString(),
          end_time: new Date(form.end_time).toISOString(),
          is_active: form.is_active
        }).select().single();
        
        if (error) throw error;
        saleId = data.id;
      } else {
        const { error } = await supabase.from('flash_sales').update({
          title: form.title,
          start_time: new Date(form.start_time).toISOString(),
          end_time: new Date(form.end_time).toISOString(),
          is_active: form.is_active
        }).eq('id', form.id);
        
        if (error) throw error;
      }
      
      setIsModalOpen(false);
      fetchData();
      return true;
    } catch (error: any) {
      alert(error.message);
      return false;
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from('flash_sales').update({ is_active: !current }).eq('id', id);
    fetchData();
  };

  const deleteSale = async (id: string) => {
    if (!confirm('Yakin ingin menghapus flash sale ini? Semua konfigurasi stok diskonnya juga akan terhapus.')) return;
    await supabase.from('flash_sales').delete().eq('id', id);
    fetchData();
  };

  const addItem = async (product: any, variant: any = null, callback?: () => void) => {
    if (!form.id) {
       alert("Simpan pengaturan jadwal Flash Sale terlebih dahulu sebelum memasukkan produk.");
       return;
    }
    
    const basePrice = product.price || 0;
    
    const { data, error } = await supabase.from('flash_sale_items').insert({
      flash_sale_id: form.id,
      product_id: product.id,
      variant_id: variant?.id || null,
      flash_sale_price: Math.floor(basePrice * 0.8), // default 20% off
      allocated_stock: 10,
      max_qty_per_user: 1
    }).select('*, products(name, price), variants(size, color)').single();
    
    if (error) { 
      alert(error.message); 
      return; 
    }
    
    if (data) {
      setItems(prev => [...prev, data]);
      if (callback) callback();
    }
  };
  
  const updateItem = async (itemId: string, field: string, value: number) => {
    const { error } = await supabase.from('flash_sale_items').update({ [field]: value }).eq('id', itemId);
    if (!error) {
      setItems(prev => prev.map(i => i.id === itemId ? { ...i, [field]: value } : i));
    }
  };

  const deleteItem = async (itemId: string) => {
    await supabase.from('flash_sale_items').delete().eq('id', itemId);
    setItems(prev => prev.filter(i => i.id !== itemId));
  };

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return {
    state: {
      sales,
      loading,
      isModalOpen,
      isEditing,
      form,
      items,
      searchQuery,
      filteredProducts
    },
    actions: {
      fetchData,
      setIsModalOpen,
      setForm,
      setSearchQuery,
      openNewSale,
      openEditSale,
      saveSale,
      toggleActive,
      deleteSale,
      addItem,
      updateItem,
      deleteItem
    }
  };
}

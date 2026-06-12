-- WMS & Finance System Tables for NINOC

-- 1. Purchase Orders (PO)
CREATE TABLE IF NOT EXISTS purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number VARCHAR(50) UNIQUE NOT NULL,
  vendor_name VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'draft', -- draft, sent, partial, received, cancelled
  total_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
  expected_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. PO Items
CREATE TABLE IF NOT EXISTS po_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id UUID REFERENCES purchase_orders(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES variants(id) ON DELETE CASCADE,
  qty_ordered INTEGER NOT NULL DEFAULT 0,
  qty_received INTEGER NOT NULL DEFAULT 0,
  unit_cost DECIMAL(15, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Stock Ledgers (Kartu Mutasi Stok)
CREATE TABLE IF NOT EXISTS stock_ledgers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id UUID REFERENCES variants(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL, -- 'in_po', 'out_order', 'adj_manual', 'retur'
  qty INTEGER NOT NULL, -- positive for in, negative for out
  reference_id VARCHAR(100), -- e.g., PO number or Order ID
  notes TEXT,
  created_by VARCHAR(255), -- email of the admin
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS (Row Level Security) - Admin only access
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE po_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_ledgers ENABLE ROW LEVEL SECURITY;

-- Allow anon/authenticated if accessed via secure server routes, or define specific policies
CREATE POLICY "Enable all access for authenticated users" ON purchase_orders FOR ALL USING (true);
CREATE POLICY "Enable all access for authenticated users" ON po_items FOR ALL USING (true);
CREATE POLICY "Enable all access for authenticated users" ON stock_ledgers FOR ALL USING (true);

-- RPC for Receiving Stock from DO (Delivery Order)
CREATE OR REPLACE FUNCTION receive_po_item(
  p_po_item_id UUID,
  p_qty_received INTEGER,
  p_admin_email VARCHAR
) RETURNS VOID AS $$
DECLARE
  v_po_id UUID;
  v_variant_id UUID;
  v_po_number VARCHAR;
BEGIN
  -- Get PO item details
  SELECT po_id, variant_id INTO v_po_id, v_variant_id
  FROM po_items WHERE id = p_po_item_id;

  -- Get PO number
  SELECT po_number INTO v_po_number
  FROM purchase_orders WHERE id = v_po_id;

  -- Update PO item received quantity
  UPDATE po_items
  SET qty_received = qty_received + p_qty_received
  WHERE id = p_po_item_id;

  -- Update Product Variant stock
  UPDATE variants
  SET stock_quantity = stock_quantity + p_qty_received
  WHERE id = v_variant_id;

  -- Insert into Stock Ledger
  INSERT INTO stock_ledgers (variant_id, type, qty, reference_id, notes, created_by)
  VALUES (v_variant_id, 'in_po', p_qty_received, v_po_number, 'DO Received', p_admin_email);
  
END;
$$ LANGUAGE plpgsql;

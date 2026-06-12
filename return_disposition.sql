-- ============================================================
-- NINOC: Return Disposition & Defect Inventory System
-- ============================================================

-- 1. Defect Inventory Table
-- Tracks items that are returned by customers and marked as defective/rejected
CREATE TABLE IF NOT EXISTS defect_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_id UUID REFERENCES order_returns(id),
  return_item_id UUID REFERENCES return_items(id),
  variant_id UUID REFERENCES variants(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  reason TEXT,
  logged_by VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE defect_inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for authenticated users" ON defect_inventory FOR ALL USING (true);


-- 2. RPC to Process Return Disposition
-- This function processes each returned item. If it's 'restock', it increments active stock.
-- If it's 'reject_defect', it logs it into defect_inventory without affecting active stock.
-- Both actions create a stock_ledgers entry for historical tracking.
CREATE OR REPLACE FUNCTION process_return_disposition(
  p_return_id UUID,
  p_dispositions JSONB, -- Example: '[{"return_item_id": "uuid", "disposition": "restock" | "reject_defect"}]'
  p_admin_email VARCHAR
) RETURNS VOID AS $$
DECLARE
  v_disposition_obj JSONB;
  v_return_item_id UUID;
  v_disposition VARCHAR;
  
  v_quantity INTEGER;
  v_variant_id UUID;
  v_reason TEXT;
  v_order_id UUID;
BEGIN
  -- Get Order ID for reference
  SELECT order_id INTO v_order_id FROM order_returns WHERE id = p_return_id;

  -- Loop through the dispositions array
  FOR v_disposition_obj IN SELECT * FROM jsonb_array_elements(p_dispositions)
  LOOP
    v_return_item_id := (v_disposition_obj->>'return_item_id')::UUID;
    v_disposition := v_disposition_obj->>'disposition';

    -- Get variant_id and quantity for this return item
    SELECT ri.quantity, ri.reason, oi.variant_id 
    INTO v_quantity, v_reason, v_variant_id
    FROM return_items ri
    JOIN order_items oi ON ri.order_item_id = oi.id
    WHERE ri.id = v_return_item_id;

    IF v_variant_id IS NULL THEN
      CONTINUE; -- Skip if variant is null (e.g., custom product without variant)
    END IF;

    IF v_disposition = 'restock' THEN
      -- Add back to active stock
      UPDATE variants 
      SET stock_quantity = stock_quantity + v_quantity 
      WHERE id = v_variant_id;

      -- Log in ledger
      INSERT INTO stock_ledgers (variant_id, type, qty, reference_id, notes, created_by)
      VALUES (v_variant_id, 'retur_restock', v_quantity, v_order_id::VARCHAR, 'Returned and restocked', p_admin_email);

    ELSIF v_disposition = 'reject_defect' THEN
      -- Insert into defect inventory
      INSERT INTO defect_inventory (return_id, return_item_id, variant_id, quantity, reason, logged_by)
      VALUES (p_return_id, v_return_item_id, v_variant_id, v_quantity, v_reason, p_admin_email);

      -- Log in ledger (qty 0 effect on active stock, but we record it for transparency)
      -- Using qty = 0 in ledger, or we can use v_quantity and let the application know 'retur_defect' doesn't count towards active stock.
      -- To avoid breaking standard sum queries, we will use qty = 0 but put the defective quantity in notes.
      INSERT INTO stock_ledgers (variant_id, type, qty, reference_id, notes, created_by)
      VALUES (v_variant_id, 'retur_defect', 0, v_order_id::VARCHAR, 'Defective return (Qty: ' || v_quantity || '). Reason: ' || COALESCE(v_reason, ''), p_admin_email);
    END IF;

  END LOOP;
END;
$$ LANGUAGE plpgsql;

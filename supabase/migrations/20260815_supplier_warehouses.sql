-- Add supplier_id to warehouses table for supplier warehouse support
ALTER TABLE warehouses 
ADD COLUMN supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL;

ALTER TABLE warehouses
ADD COLUMN warehouse_type VARCHAR(50) DEFAULT 'ninoc_hub';

ALTER TABLE suppliers 
ADD COLUMN assigned_hub_id UUID REFERENCES warehouses(id) ON DELETE SET NULL;

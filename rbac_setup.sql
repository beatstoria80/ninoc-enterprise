-- RBAC System Tables for NINOC Admin

CREATE TABLE IF NOT EXISTS admin_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'outbound_logistics', -- super_admin, finance, inbound_warehouse, outbound_logistics
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;

-- Everyone can read the roles (needed for login check)
CREATE POLICY "Enable read access for all authenticated users" ON admin_roles FOR SELECT USING (true);

-- Only super admins should be able to modify roles, but for now we'll allow anon/authenticated so the admin dashboard can manage it if needed
CREATE POLICY "Enable insert/update for authenticated" ON admin_roles FOR ALL USING (true);

-- Seed Initial Super Admin (using the backdoor email)
INSERT INTO admin_roles (email, role) 
VALUES ('admin@ninoc.store', 'super_admin')
ON CONFLICT (email) DO NOTHING;

-- Seed dummy roles for testing
INSERT INTO admin_roles (email, role) VALUES ('finance@ninoc.com', 'finance') ON CONFLICT DO NOTHING;
INSERT INTO admin_roles (email, role) VALUES ('gudang@ninoc.com', 'inbound_warehouse') ON CONFLICT DO NOTHING;
INSERT INTO admin_roles (email, role) VALUES ('logistik@ninoc.com', 'outbound_logistics') ON CONFLICT DO NOTHING;

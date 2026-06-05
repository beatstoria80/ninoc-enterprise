-- ============================================================
-- NINOC Support Center — Fix Category CHECK Constraint
-- Run this in Supabase Dashboard > SQL Editor
-- ============================================================

-- Drop the restrictive CHECK constraint
ALTER TABLE support_tickets DROP CONSTRAINT IF EXISTS support_tickets_category_check;

-- Re-create with all allowed categories (matching QUICK_ACTIONS + general)
ALTER TABLE support_tickets ADD CONSTRAINT support_tickets_category_check
CHECK (category IN (
  'shipping', 'return', 'product', 'payment', 'other',
  'greeting', 'complaint', 'general', 'closing', 'english',
  'nsfw_reject', 'sara_warn'
));

-- Verify
SELECT 'CHECK constraint updated successfully' AS status;
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint WHERE conname = 'support_tickets_category_check';

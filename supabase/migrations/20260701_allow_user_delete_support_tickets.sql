-- ============================================================
-- Allow authenticated users to delete their own support tickets
-- ============================================================

-- Add DELETE policy for support_tickets
CREATE POLICY "Users can delete their own support tickets"
ON support_tickets FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Note: support_messages already has ON DELETE CASCADE to ticket_id,
-- so deleting a ticket will automatically delete its messages.

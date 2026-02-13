-- Add initiative_id to notifications for deep-linking (link can be derived on client)
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS initiative_id text REFERENCES initiatives(id) ON DELETE SET NULL;

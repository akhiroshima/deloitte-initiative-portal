-- Update schema to add missing timestamp columns
-- Run this in your Supabase SQL editor

-- Add missing timestamp columns to initiatives table
alter table initiatives add column if not exists created_at timestamp with time zone default now();
alter table initiatives add column if not exists updated_at timestamp with time zone default now();

-- Add missing timestamp columns to help_wanted table
alter table help_wanted add column if not exists created_at timestamp with time zone default now();
alter table help_wanted add column if not exists updated_at timestamp with time zone default now();

-- Add foreign key constraint for initiatives owner_id
-- Note: This will fail if the constraint already exists, which is fine
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'initiatives_owner_id_fkey'
    ) THEN
        ALTER TABLE initiatives ADD CONSTRAINT initiatives_owner_id_fkey 
            FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

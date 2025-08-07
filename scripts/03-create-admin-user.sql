-- First, let's create a simple admin table for basic auth
-- This is a workaround since we can't directly create Supabase Auth users via SQL

CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Update the admin user credentials
UPDATE admin_users 
SET email = 'leomesimho@gmail.com', password_hash = 'eladfatboy191%%%'
WHERE email = 'admin@maccabi-stickers.com';

-- If the update didn't affect any rows, insert the new admin
INSERT INTO admin_users (email, password_hash) 
SELECT 'leomesimho@gmail.com', 'eladfatboy191%%%'
WHERE NOT EXISTS (SELECT 1 FROM admin_users WHERE email = 'leomesimho@gmail.com');

-- Remove the old admin user if it exists
DELETE FROM admin_users WHERE email = 'admin@maccabi-stickers.com';

-- Create a simple function to check admin credentials
CREATE OR REPLACE FUNCTION check_admin_login(email_input TEXT, password_input TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM admin_users 
        WHERE email = email_input AND password_hash = password_input
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policies to be more permissive for admin operations
-- Temporarily disable RLS for easier testing
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;

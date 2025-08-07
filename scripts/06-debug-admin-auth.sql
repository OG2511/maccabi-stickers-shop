-- Let's check what's in the admin_users table
SELECT * FROM admin_users;

-- Drop and recreate the table to make sure it's clean
DROP TABLE IF EXISTS admin_users CASCADE;

CREATE TABLE admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert the admin user
INSERT INTO admin_users (email, password_hash) VALUES 
('leomesimho@gmail.com', 'eladfatboy191%%%');

-- Recreate the function
DROP FUNCTION IF EXISTS check_admin_login(TEXT, TEXT);

CREATE OR REPLACE FUNCTION check_admin_login(email_input TEXT, password_input TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    user_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM admin_users 
        WHERE email = email_input AND password_hash = password_input
    ) INTO user_exists;
    
    -- Log for debugging
    RAISE NOTICE 'Checking login for email: %, password: %, result: %', email_input, password_input, user_exists;
    
    RETURN user_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test the function
SELECT check_admin_login('leomesimho@gmail.com', 'eladfatboy191%%%') as should_be_true;
SELECT check_admin_login('wrong@email.com', 'wrongpass') as should_be_false;

-- Check the table contents
SELECT email, password_hash FROM admin_users;

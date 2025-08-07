-- Make sure the admin user exists with correct credentials
DELETE FROM admin_users WHERE email IN ('admin@maccabi-stickers.com', 'leomesimho@gmail.com');

INSERT INTO admin_users (email, password_hash) VALUES 
('leomesimho@gmail.com', 'eladfatboy191%%%');

-- Recreate the function to ensure it works properly
DROP FUNCTION IF EXISTS check_admin_login(TEXT, TEXT);

CREATE OR REPLACE FUNCTION check_admin_login(email_input TEXT, password_input TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM admin_users 
        WHERE email = email_input AND password_hash = password_input
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test the function
SELECT check_admin_login('leomesimho@gmail.com', 'eladfatboy191%%%') as login_test;

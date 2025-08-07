-- Let's simplify and make sure everything works
DROP TABLE IF EXISTS admin_users CASCADE;
DROP FUNCTION IF EXISTS check_admin_login(TEXT, TEXT);

-- Create a simple admin table
CREATE TABLE admin_users (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insert the admin user
INSERT INTO admin_users (email, password_hash) VALUES 
('leomesimho@gmail.com', 'eladfatboy191%%%');

-- Create a simple function
CREATE OR REPLACE FUNCTION check_admin_login(email_input TEXT, password_input TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM admin_users 
        WHERE email = email_input AND password_hash = password_input
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION check_admin_login(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION check_admin_login(TEXT, TEXT) TO authenticated;

-- Test the function
SELECT check_admin_login('leomesimho@gmail.com', 'eladfatboy191%%%') as test_result;

-- Show what's in the table
SELECT * FROM admin_users;

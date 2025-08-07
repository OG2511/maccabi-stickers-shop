-- Let's simplify the table structure to avoid type issues
DROP TABLE IF EXISTS active_users CASCADE;

CREATE TABLE active_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT UNIQUE NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    city TEXT,
    country TEXT,
    user_agent TEXT,
    ip_address TEXT,
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_active_users_last_seen ON active_users(last_seen);
CREATE INDEX idx_active_users_session ON active_users(session_id);

-- Simplified cleanup function
CREATE OR REPLACE FUNCTION cleanup_inactive_users()
RETURNS void AS $$
BEGIN
    DELETE FROM active_users 
    WHERE last_seen < NOW() - INTERVAL '5 minutes';
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT ALL ON active_users TO authenticated;
GRANT ALL ON active_users TO anon;
GRANT EXECUTE ON FUNCTION cleanup_inactive_users() TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_inactive_users() TO anon;

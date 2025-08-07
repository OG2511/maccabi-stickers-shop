-- Create table for tracking active users and their locations
CREATE TABLE active_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT UNIQUE NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    city TEXT,
    country TEXT,
    user_agent TEXT,
    ip_address INET,
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for efficient queries
CREATE INDEX idx_active_users_last_seen ON active_users(last_seen);
CREATE INDEX idx_active_users_session ON active_users(session_id);

-- Function to clean up old users (older than 5 minutes)
CREATE OR REPLACE FUNCTION cleanup_inactive_users()
RETURNS void AS $$
BEGIN
    DELETE FROM active_users 
    WHERE last_seen < NOW() - INTERVAL '5 minutes';
END;
$$ LANGUAGE plpgsql;

-- Function to update or insert user location
CREATE OR REPLACE FUNCTION upsert_user_location(
    p_session_id TEXT,
    p_latitude DECIMAL,
    p_longitude DECIMAL,
    p_city TEXT DEFAULT NULL,
    p_country TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_ip_address INET DEFAULT NULL
)
RETURNS void AS $$
BEGIN
    INSERT INTO active_users (session_id, latitude, longitude, city, country, user_agent, ip_address, last_seen)
    VALUES (p_session_id, p_latitude, p_longitude, p_city, p_country, p_user_agent, p_ip_address, NOW())
    ON CONFLICT (session_id) 
    DO UPDATE SET 
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        city = EXCLUDED.city,
        country = EXCLUDED.country,
        user_agent = EXCLUDED.user_agent,
        ip_address = EXCLUDED.ip_address,
        last_seen = NOW();
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT ALL ON active_users TO authenticated;
GRANT ALL ON active_users TO anon;
GRANT EXECUTE ON FUNCTION cleanup_inactive_users() TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_inactive_users() TO anon;
GRANT EXECUTE ON FUNCTION upsert_user_location(TEXT, DECIMAL, DECIMAL, TEXT, TEXT, TEXT, INET) TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_user_location(TEXT, DECIMAL, DECIMAL, TEXT, TEXT, TEXT, INET) TO anon;

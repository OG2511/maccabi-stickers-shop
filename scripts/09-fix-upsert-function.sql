-- Drop the existing function
DROP FUNCTION IF EXISTS upsert_user_location(TEXT, DECIMAL, DECIMAL, TEXT, TEXT, TEXT, INET);

-- Create the function with proper parameter handling
CREATE OR REPLACE FUNCTION upsert_user_location(
    p_session_id TEXT,
    p_latitude DECIMAL,
    p_longitude DECIMAL,
    p_city TEXT DEFAULT NULL,
    p_country TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_ip_address TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
    INSERT INTO active_users (session_id, latitude, longitude, city, country, user_agent, ip_address, last_seen)
    VALUES (p_session_id, p_latitude, p_longitude, p_city, p_country, p_user_agent, p_ip_address::inet, NOW())
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
GRANT EXECUTE ON FUNCTION upsert_user_location(TEXT, DECIMAL, DECIMAL, TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_user_location(TEXT, DECIMAL, DECIMAL, TEXT, TEXT, TEXT, TEXT) TO anon;

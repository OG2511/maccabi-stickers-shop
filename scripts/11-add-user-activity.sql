-- Add new columns for tracking user activity
ALTER TABLE active_users
ADD COLUMN current_page TEXT,
ADD COLUMN cart_items JSONB;

-- Drop the old upsert function
DROP FUNCTION IF EXISTS upsert_user_location(TEXT, DECIMAL, DECIMAL, TEXT, TEXT, TEXT, TEXT);

-- Recreate the function to include the new fields
CREATE OR REPLACE FUNCTION upsert_user_location(
    p_session_id TEXT,
    p_latitude DECIMAL,
    p_longitude DECIMAL,
    p_city TEXT DEFAULT NULL,
    p_country TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_ip_address TEXT DEFAULT NULL,
    p_current_page TEXT DEFAULT NULL,
    p_cart_items JSONB DEFAULT NULL
)
RETURNS void AS $$
BEGIN
    INSERT INTO active_users (session_id, latitude, longitude, city, country, user_agent, ip_address, current_page, cart_items, last_seen)
    VALUES (p_session_id, p_latitude, p_longitude, p_city, p_country, p_user_agent, p_ip_address::inet, p_current_page, p_cart_items, NOW())
    ON CONFLICT (session_id) 
    DO UPDATE SET 
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        city = EXCLUDED.city,
        country = EXCLUDED.country,
        user_agent = EXCLUDED.user_agent,
        ip_address = EXCLUDED.ip_address,
        current_page = EXCLUDED.current_page,
        cart_items = EXCLUDED.cart_items,
        last_seen = NOW();
END;
$$ LANGUAGE plpgsql;

-- Grant permissions for the new function signature
GRANT EXECUTE ON FUNCTION upsert_user_location(TEXT, DECIMAL, DECIMAL, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_user_location(TEXT, DECIMAL, DECIMAL, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB) TO anon;

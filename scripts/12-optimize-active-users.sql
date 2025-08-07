-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_active_users_last_seen_desc ON active_users(last_seen DESC);
CREATE INDEX IF NOT EXISTS idx_active_users_city ON active_users(city) WHERE city IS NOT NULL;

-- Optimize the cleanup function
CREATE OR REPLACE FUNCTION cleanup_inactive_users()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM active_users 
    WHERE last_seen < NOW() - INTERVAL '10 minutes';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Also clean up very old sessions (older than 24 hours)
    DELETE FROM active_users 
    WHERE created_at < NOW() - INTERVAL '24 hours';
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION cleanup_inactive_users() TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_inactive_users() TO anon;

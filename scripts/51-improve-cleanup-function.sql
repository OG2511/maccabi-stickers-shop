-- Improve the cleanup function to return the number of deleted users
CREATE OR REPLACE FUNCTION cleanup_inactive_users()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete users inactive for more than 5 minutes
    DELETE FROM active_users 
    WHERE last_seen < NOW() - INTERVAL '5 minutes';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Also clean up very old sessions (older than 24 hours) as a safety measure
    DELETE FROM active_users 
    WHERE created_at < NOW() - INTERVAL '24 hours';
    
    -- Log the cleanup
    RAISE NOTICE 'Cleaned up % inactive users', deleted_count;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION cleanup_inactive_users() TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_inactive_users() TO anon;

-- Test the function
SELECT cleanup_inactive_users() as users_cleaned;

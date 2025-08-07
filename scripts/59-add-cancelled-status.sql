-- Add cancelled status to order_status enum
DO $$ 
BEGIN
    -- Check if the enum value already exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'cancelled' 
        AND enumtypid = (
            SELECT oid FROM pg_type WHERE typname = 'order_status'
        )
    ) THEN
        -- Add the new enum value
        ALTER TYPE order_status ADD VALUE 'cancelled';
        RAISE NOTICE 'Added cancelled status to order_status enum';
    ELSE
        RAISE NOTICE 'cancelled status already exists in order_status enum';
    END IF;
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Error adding cancelled status: %', SQLERRM;
END $$;

-- Verify the enum values
SELECT enumlabel as status_values 
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'order_status')
ORDER BY enumsortorder;

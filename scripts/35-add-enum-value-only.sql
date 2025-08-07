-- Step 1: Add the new enum value only
-- This must be done in a separate transaction

-- First, check if the value already exists
DO $$
BEGIN
    -- Check if the value already exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'מ.ח. 22' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'collection_type')
    ) THEN
        -- Add the new enum value
        ALTER TYPE collection_type ADD VALUE 'מ.ח. 22';
        RAISE NOTICE 'Added "מ.ח. 22" to collection_type enum';
    ELSE
        RAISE NOTICE '"מ.ח. 22" already exists in collection_type enum';
    END IF;
END $$;

-- Show current enum values
SELECT 'Current enum values after addition:' as info;
SELECT unnest(enum_range(NULL::collection_type)) AS enum_values;

-- Commit this transaction
COMMIT;

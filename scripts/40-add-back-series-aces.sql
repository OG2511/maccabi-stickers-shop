-- Add back "סדרת האסים" to the enum so we can have both collections
-- This will allow us to have both "סדרת העשרים" and "סדרת האסים" (displayed as "מ.ח. 22")

-- First, check current enum values
SELECT 'Current enum values:' as info;
SELECT unnest(enum_range(NULL::collection_type)) AS current_values;

-- Add "סדרת האסים" back to the enum if it doesn't exist
DO $$
BEGIN
    -- Check if the value already exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'סדרת האסים' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'collection_type')
    ) THEN
        -- Add the new enum value
        ALTER TYPE collection_type ADD VALUE 'סדרת האסים';
        RAISE NOTICE 'Added "סדרת האסים" back to collection_type enum';
    ELSE
        RAISE NOTICE '"סדרת האסים" already exists in collection_type enum';
    END IF;
END $$;

-- Show updated enum values
SELECT 'Updated enum values:' as info;
SELECT unnest(enum_range(NULL::collection_type)) AS updated_values;

-- Show current collections and their counts
SELECT 'Current collections in database:' as info;
SELECT 
  collection,
  COUNT(*) as product_count
FROM products 
GROUP BY collection 
ORDER BY collection;

COMMIT;

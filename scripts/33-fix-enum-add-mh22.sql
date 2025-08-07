-- Fix the enum issue by adding "מ.ח. 22" to collection_type
-- First, let's see what values are currently in the enum
SELECT 'Current enum values:' as info;
SELECT unnest(enum_range(NULL::collection_type)) AS current_values;

-- Add the new collection type "מ.ח. 22"
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

-- Show the updated enum values
SELECT 'Updated enum values:' as info;
SELECT unnest(enum_range(NULL::collection_type)) AS updated_values;

-- Update any existing products that might have "סדרת האסים" to "מ.ח. 22"
UPDATE products 
SET collection = 'מ.ח. 22' 
WHERE collection = 'סדרת האסים';

-- Show how many products were updated
SELECT 
  'Products updated from "סדרת האסים" to "מ.ח. 22"' as action,
  COUNT(*) as count
FROM products 
WHERE collection = 'מ.ח. 22';

-- Show all current collections and their counts
SELECT 'Current collections:' as info;
SELECT 
  collection,
  COUNT(*) as product_count
FROM products 
GROUP BY collection 
ORDER BY collection;

-- Test that we can now insert a product with "מ.ח. 22"
SELECT 'Testing enum value "מ.ח. 22"...' as test;

COMMIT;

-- Completely recreate the enum without any graffiti variations
DO $$
BEGIN
    -- Drop the existing enum constraint temporarily
    ALTER TABLE products ALTER COLUMN collection TYPE TEXT;
    
    -- Drop the old enum
    DROP TYPE IF EXISTS collection_type CASCADE;
    
    -- Create new clean enum without any graffiti
    CREATE TYPE collection_type AS ENUM (
        '110 שנים למכבי חיפה',
        'Green Apes On Tour',
        'אליפות 20/21',
        'אליפות וכוכב',
        'בשביל כל האחים',
        'סדרת העשרים',
        'סדרת האסים',
        'סדרת רטרו',
        'קופים 2021',
        'קופים 2024',
        'מיוחדים'
    );
    
    -- Apply the new enum to the products table
    ALTER TABLE products ALTER COLUMN collection TYPE collection_type USING collection::collection_type;
    
    RAISE NOTICE 'Successfully cleaned enum and removed all graffiti variations';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error cleaning enum: %', SQLERRM;
END $$;

-- Final verification
SELECT 'Final enum values:' as info;
SELECT unnest(enum_range(NULL::collection_type)) AS clean_collections;

SELECT 'Final product collections:' as info;
SELECT 
  collection,
  COUNT(*) as count
FROM products 
GROUP BY collection 
ORDER BY collection;

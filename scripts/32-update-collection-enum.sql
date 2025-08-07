-- Update the collection_type enum to include "מ.ח. 22" instead of "סדרת האסים"
-- First, let's see what values are currently in the enum
SELECT unnest(enum_range(NULL::collection_type)) AS collection_values;

-- Add the new collection type
ALTER TYPE collection_type ADD VALUE 'מ.ח. 22';

-- Update existing products that have "סדרת האסים" to "מ.ח. 22"
UPDATE products 
SET collection = 'מ.ח. 22' 
WHERE collection = 'סדרת האסים';

-- Show the updated enum values
SELECT unnest(enum_range(NULL::collection_type)) AS collection_values;

-- Show how many products were updated
SELECT 
  collection,
  COUNT(*) as product_count
FROM products 
GROUP BY collection 
ORDER BY collection;

COMMIT;

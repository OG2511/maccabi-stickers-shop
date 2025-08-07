-- Alternative approach: Use existing enum value and handle in code
-- If the above doesn't work, we can use this approach

-- Let's see what enum values we currently have
SELECT 'Current available enum values:' as info;
SELECT unnest(enum_range(NULL::collection_type)) AS available_values;

-- Option 1: Use "כלליים" for now and handle display in the frontend
UPDATE products 
SET collection = 'כלליים' 
WHERE collection = 'סדרת האסים';

-- Option 2: Or use "סדרת העשרים" if that exists
-- UPDATE products 
-- SET collection = 'סדרת העשרים' 
-- WHERE collection = 'סדרת האסים';

-- Show the result
SELECT 'Updated collections:' as result;
SELECT 
  collection,
  COUNT(*) as product_count
FROM products 
GROUP BY collection 
ORDER BY collection;

COMMIT;

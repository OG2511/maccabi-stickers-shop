-- Move products from "כלליים" to "סדרת העשרים" for better organization
-- This will be displayed as "מ.ח. 22" in the UI

-- First, let's see what we have in "כלליים" now
SELECT 'Products currently in כלליים:' as info;
SELECT name, collection FROM products WHERE collection = 'כלליים';

-- Move products that were previously "סדרת האסים" to "סדרת העשרים"
-- We'll assume these are the products that should be "מ.ח. 22"
UPDATE products 
SET collection = 'סדרת העשרים' 
WHERE collection = 'כלליים';

-- Show the updated collections
SELECT 'Updated collections summary:' as result;
SELECT 
  collection,
  COUNT(*) as product_count
FROM products 
GROUP BY collection 
ORDER BY collection;

COMMIT;

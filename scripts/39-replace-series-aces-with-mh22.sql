-- Replace "סדרת האסים" with "סדרת העשרים" and display as "מ.ח. 22"
-- First, let's see what we currently have

SELECT 'Current collections before update:' as info;
SELECT 
  collection,
  COUNT(*) as product_count
FROM products 
GROUP BY collection 
ORDER BY collection;

-- Move products from "כלליים" back to "סדרת העשרים" 
-- (these were moved from "סדרת האסים" in the previous script)
UPDATE products 
SET collection = 'סדרת העשרים' 
WHERE collection = 'כלליים';

-- Also update any remaining "סדרת האסים" products to "סדרת העשרים"
UPDATE products 
SET collection = 'סדרת העשרים' 
WHERE collection = 'סדרת האסים';

-- Show the final result
SELECT 'Collections after replacement:' as result;
SELECT 
  collection,
  COUNT(*) as product_count
FROM products 
GROUP BY collection 
ORDER BY collection;

-- Show which products are now in "סדרת העשרים" (will be displayed as "מ.ח. 22")
SELECT 'Products that will be displayed as "מ.ח. 22":' as info;
SELECT name FROM products WHERE collection = 'סדרת העשרים' ORDER BY name;

COMMIT;

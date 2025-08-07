-- Update collection name from "סדרת האסים" to "מ.ח. 22"
UPDATE products 
SET collection = 'מ.ח. 22' 
WHERE collection = 'סדרת האסים';

-- Show how many products were updated
SELECT 
  'Products updated' as action,
  COUNT(*) as count
FROM products 
WHERE collection = 'מ.ח. 22';

-- Show all collections and their counts
SELECT 
  collection,
  COUNT(*) as product_count
FROM products 
GROUP BY collection 
ORDER BY collection;

COMMIT;

-- Remove both Hebrew and English graffiti collections
-- Delete all products in graffiti collections (both Hebrew and English)
DELETE FROM products WHERE collection IN ('גרפיטי', 'graffiti', 'Graffiti');

-- Show what was deleted
SELECT 'Products deleted from graffiti collections' as action;

-- Show remaining collections
SELECT 'Remaining collections:' as info;
SELECT 
  collection,
  COUNT(*) as product_count
FROM products 
GROUP BY collection 
ORDER BY collection;

-- Verify no graffiti products remain
SELECT 'Verification - graffiti products remaining:' as check;
SELECT COUNT(*) as graffiti_products_count
FROM products 
WHERE collection ILIKE '%graffiti%' OR collection ILIKE '%גרפיטי%';

COMMIT;

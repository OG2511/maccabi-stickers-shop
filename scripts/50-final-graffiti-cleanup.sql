-- Final cleanup to ensure no graffiti remains anywhere
-- Check for any remaining graffiti references
SELECT 'Searching for any graffiti references...' as search;

-- Check products table
SELECT 'Products with graffiti in name or collection:' as check;
SELECT id, name, collection 
FROM products 
WHERE name ILIKE '%graffiti%' 
   OR name ILIKE '%גרפיטי%'
   OR collection ILIKE '%graffiti%' 
   OR collection ILIKE '%גרפיטי%';

-- Check orders for graffiti products (in case there are historical orders)
SELECT 'Historical orders with graffiti products:' as historical_check;
SELECT DISTINCT o.id, o.created_at, oi.product_id
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
JOIN products p ON oi.product_id = p.id
WHERE p.name ILIKE '%graffiti%' 
   OR p.name ILIKE '%גרפיטי%'
   OR p.collection ILIKE '%graffiti%' 
   OR p.collection ILIKE '%גרפיטי%';

-- Clean up any remaining graffiti products by name
DELETE FROM products 
WHERE name ILIKE '%graffiti%' 
   OR name ILIKE '%גרפיטי%';

-- Show final clean state
SELECT 'FINAL CLEAN STATE:' as final_state;
SELECT 
  'Total products' as metric,
  COUNT(*) as value
FROM products

UNION ALL

SELECT 
  'Available collections' as metric,
  COUNT(DISTINCT collection) as value
FROM products

UNION ALL

SELECT 
  'Graffiti references' as metric,
  COUNT(*) as value
FROM products 
WHERE name ILIKE '%graffiti%' 
   OR name ILIKE '%גרפיטי%'
   OR collection ILIKE '%graffiti%' 
   OR collection ILIKE '%גרפיטי%';

COMMIT;

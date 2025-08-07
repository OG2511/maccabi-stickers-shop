-- Remove "כלליים" collection and move products to appropriate collections
-- First, let's see what we currently have

SELECT 'Current collections and product counts:' as info;
SELECT 
  collection,
  COUNT(*) as product_count,
  SUM(stock) as total_stock
FROM products 
GROUP BY collection 
ORDER BY collection;

-- Show products in "כלליים" collection
SELECT 'Products currently in כלליים collection:' as info;
SELECT id, name, stock, collection FROM products WHERE collection = 'כלליים';

-- Move products from "כלליים" to "סדרת רטרו" (or another appropriate collection)
-- You can change this to any collection you prefer
UPDATE products 
SET collection = 'סדרת רטרו' 
WHERE collection = 'כלליים';

-- Show updated collections
SELECT 'Updated collections after moving כלליים products:' as result;
SELECT 
  collection,
  COUNT(*) as product_count,
  SUM(stock) as total_stock
FROM products 
GROUP BY collection 
ORDER BY collection;

-- Calculate total stock across all products
SELECT 'TOTAL INVENTORY SUMMARY:' as summary;
SELECT 
  COUNT(*) as total_products,
  SUM(stock) as total_stickers_in_stock,
  AVG(stock) as average_stock_per_product,
  MIN(stock) as minimum_stock,
  MAX(stock) as maximum_stock
FROM products;

-- Show detailed inventory by collection
SELECT 'INVENTORY BY COLLECTION:' as breakdown;
SELECT 
  collection,
  COUNT(*) as products_count,
  SUM(stock) as stickers_in_stock,
  AVG(stock) as avg_per_product,
  MIN(stock) as min_stock,
  MAX(stock) as max_stock
FROM products 
GROUP BY collection 
ORDER BY SUM(stock) DESC;

-- Show products with low stock (less than 10)
SELECT 'LOW STOCK PRODUCTS (less than 10):' as low_stock;
SELECT name, collection, stock 
FROM products 
WHERE stock < 10 
ORDER BY stock ASC;

-- Show products with high stock (more than 100)
SELECT 'HIGH STOCK PRODUCTS (more than 100):' as high_stock;
SELECT name, collection, stock 
FROM products 
WHERE stock > 100 
ORDER BY stock DESC;

COMMIT;

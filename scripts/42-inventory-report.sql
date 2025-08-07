-- Comprehensive inventory report
-- This script will give you detailed information about your stock

SELECT '=== MACCABI STICKERS INVENTORY REPORT ===' as report_title;
SELECT 'Generated on: ' || NOW()::timestamp as report_date;

-- Overall summary
SELECT 'OVERALL INVENTORY SUMMARY:' as section;
SELECT 
  COUNT(*) as "Total Products",
  SUM(stock) as "Total Stickers in Stock",
  ROUND(AVG(stock), 2) as "Average Stock per Product",
  MIN(stock) as "Minimum Stock",
  MAX(stock) as "Maximum Stock",
  COUNT(CASE WHEN stock = 0 THEN 1 END) as "Out of Stock Products",
  COUNT(CASE WHEN stock < 10 THEN 1 END) as "Low Stock Products (< 10)",
  COUNT(CASE WHEN stock > 100 THEN 1 END) as "High Stock Products (> 100)"
FROM products;

-- Inventory by collection
SELECT 'INVENTORY BY COLLECTION:' as section;
SELECT 
  collection as "Collection",
  COUNT(*) as "Products",
  SUM(stock) as "Total Stock",
  ROUND(AVG(stock), 2) as "Avg Stock",
  MIN(stock) as "Min",
  MAX(stock) as "Max",
  ROUND((SUM(stock) * 100.0 / (SELECT SUM(stock) FROM products)), 2) as "% of Total Stock"
FROM products 
GROUP BY collection 
ORDER BY SUM(stock) DESC;

-- Top 10 products by stock
SELECT 'TOP 10 PRODUCTS BY STOCK:' as section;
SELECT 
  name as "Product Name",
  collection as "Collection",
  stock as "Stock Quantity"
FROM products 
ORDER BY stock DESC 
LIMIT 10;

-- Products that need restocking (stock < 20)
SELECT 'PRODUCTS NEEDING RESTOCK (Stock < 20):' as section;
SELECT 
  name as "Product Name",
  collection as "Collection",
  stock as "Current Stock"
FROM products 
WHERE stock < 20 
ORDER BY stock ASC;

-- Out of stock products
SELECT 'OUT OF STOCK PRODUCTS:' as section;
SELECT 
  name as "Product Name",
  collection as "Collection",
  stock as "Stock"
FROM products 
WHERE stock = 0 
ORDER BY name;

-- Stock value analysis (assuming average price)
SELECT 'STOCK VALUE ANALYSIS:' as section;
SELECT 
  collection as "Collection",
  COUNT(*) as "Products",
  SUM(stock) as "Total Stock",
  ROUND(AVG(price), 2) as "Avg Price",
  ROUND(SUM(stock * price), 2) as "Total Value (₪)"
FROM products 
GROUP BY collection 
ORDER BY SUM(stock * price) DESC;

-- Overall stock value
SELECT 'TOTAL INVENTORY VALUE:' as section;
SELECT 
  ROUND(SUM(stock * price), 2) as "Total Inventory Value (₪)",
  ROUND(AVG(price), 2) as "Average Product Price (₪)"
FROM products;

COMMIT;

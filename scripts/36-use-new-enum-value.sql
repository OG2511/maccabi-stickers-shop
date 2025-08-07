-- Step 2: Now use the new enum value (in a separate transaction)
-- This script should be run AFTER the previous one

-- Show that the enum value exists
SELECT 'Verifying enum value exists:' as status;
SELECT enumlabel as available_collections 
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'collection_type')
ORDER BY enumsortorder;

-- Update any existing products that might have "סדרת האסים" to "מ.ח. 22"
UPDATE products 
SET collection = 'מ.ח. 22' 
WHERE collection = 'סדרת האסים';

-- Show how many products were updated
SELECT 
  'Products updated from "סדרת האסים" to "מ.ח. 22"' as action,
  COUNT(*) as count
FROM products 
WHERE collection = 'מ.ח. 22';

-- Test that we can now insert a product with "מ.ח. 22"
INSERT INTO products (name, price, collection, stock, image_url) 
VALUES ('TEST - מ.ח. 22 verification', 1.00, 'מ.ח. 22', 1, null);

-- If the insert worked, delete the test product
DELETE FROM products WHERE name = 'TEST - מ.ח. 22 verification';

-- Show all current collections and their counts
SELECT 'Final collections summary:' as info;
SELECT 
  collection,
  COUNT(*) as product_count
FROM products 
GROUP BY collection 
ORDER BY collection;

SELECT 'Enum fix completed successfully!' as result;

COMMIT;

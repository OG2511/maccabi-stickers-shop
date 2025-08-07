-- Verify that the enum fix worked
SELECT 'Verifying enum values...' as status;

-- Show all enum values
SELECT enumlabel as collection_types 
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'collection_type')
ORDER BY enumsortorder;

-- Test inserting a dummy product to verify the enum works
INSERT INTO products (name, price, collection, stock, image_url) 
VALUES ('TEST - מ.ח. 22', 1.00, 'מ.ח. 22', 1, null);

-- If the insert worked, delete the test product
DELETE FROM products WHERE name = 'TEST - מ.ח. 22';

SELECT 'Enum fix verification completed successfully!' as result;

COMMIT;

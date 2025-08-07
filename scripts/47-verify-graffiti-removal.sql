-- Verify that graffiti collection has been removed
SELECT 
    'Products with graffiti collection' as check_type,
    COUNT(*) as count
FROM products 
WHERE collection = 'גרפיטי'

UNION ALL

SELECT 
    'Available collection values' as check_type,
    COUNT(*) as count
FROM (
    SELECT unnest(enum_range(NULL::collection_enum)) as collection_value
) t
WHERE collection_value = 'גרפיטי'

UNION ALL

SELECT 
    'Total products remaining' as check_type,
    COUNT(*) as count
FROM products;

-- Show all available collection values
SELECT 
    'Available collections:' as info,
    unnest(enum_range(NULL::collection_enum)) as collection_name
ORDER BY collection_name;

-- Check the actual structure of the orders table
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default,
    character_maximum_length
FROM information_schema.columns
WHERE table_name = 'orders'
ORDER BY ordinal_position;

-- Check if there are any constraints
SELECT 
    tc.constraint_name, 
    tc.constraint_type, 
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'orders';

-- Show sample data structure (if any orders exist)
SELECT * FROM orders LIMIT 1;

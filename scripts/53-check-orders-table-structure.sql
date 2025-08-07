-- Check the structure of the orders table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'orders'
ORDER BY ordinal_position;

-- Check sample data from orders table
SELECT * FROM orders LIMIT 5;

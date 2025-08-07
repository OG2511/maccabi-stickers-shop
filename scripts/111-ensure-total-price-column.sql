-- First, check if total_price column exists and add it if it doesn't
DO $$
BEGIN
    -- Check if total_price column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'total_price'
    ) THEN
        -- Add the total_price column
        ALTER TABLE orders ADD COLUMN total_price DECIMAL(10,2) DEFAULT 0.00;
        
        -- Update existing orders with calculated total_price
        UPDATE orders 
        SET total_price = COALESCE((
            SELECT SUM(oi.quantity * oi.price_per_item)
            FROM order_items oi
            WHERE oi.order_id = orders.id
        ), 0.00)
        WHERE total_price IS NULL OR total_price = 0;
        
        RAISE NOTICE 'Added total_price column and updated existing orders';
    ELSE
        RAISE NOTICE 'total_price column already exists';
    END IF;
    
    -- Check the current structure of orders table
    RAISE NOTICE 'Current orders table structure:';
END $$;

-- Show the current structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'orders'
ORDER BY ordinal_position;

-- Add total_price column to orders table
DO $$
BEGIN
    -- Check if the column doesn't exist before adding it
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'total_price'
    ) THEN
        -- Add the total_price column
        ALTER TABLE orders ADD COLUMN total_price NUMERIC(10, 2);
        
        -- Update existing orders with a default value of 0
        UPDATE orders SET total_price = 0 WHERE total_price IS NULL;
        
        -- Make the column NOT NULL
        ALTER TABLE orders ALTER COLUMN total_price SET NOT NULL;
        
        RAISE NOTICE 'Column total_price added successfully to orders table';
    ELSE
        RAISE NOTICE 'Column total_price already exists in orders table';
    END IF;
END $$;

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name = 'total_price';

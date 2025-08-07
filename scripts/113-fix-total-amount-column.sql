-- This script ensures the 'orders' table has a 'total_amount' column,
-- renaming 'total_price' if it exists, or creating it if it doesn't.

DO $$
BEGIN
    -- Check if 'total_price' column exists
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'orders' AND column_name = 'total_price'
    ) THEN
        -- If it exists, rename it to 'total_amount'
        ALTER TABLE orders RENAME COLUMN total_price TO total_amount;
        RAISE NOTICE 'Renamed column "total_price" to "total_amount" in "orders" table.';
    -- Check if 'total_amount' column does NOT exist
    ELSIF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'orders' AND column_name = 'total_amount'
    ) THEN
        -- If it doesn't exist, add it
        ALTER TABLE orders ADD COLUMN total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0;
        RAISE NOTICE 'Added column "total_amount" to "orders" table.';
    ELSE
        -- If it already exists, do nothing
        RAISE NOTICE 'Column "total_amount" already exists in "orders" table.';
    END IF;
END $$;

-- Verify the final structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'orders' AND column_name = 'total_amount';

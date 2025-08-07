-- This script robustly handles the transition from 'total_price' to 'total_amount'
-- It covers all possible scenarios to prevent errors.

DO $$
BEGIN
    -- Scenario 1: Both 'total_price' and 'total_amount' exist.
    -- This is an inconsistent state. We assume 'total_amount' is the desired one
    -- and drop the old 'total_price' column.
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'total_price') AND
       EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'total_amount') THEN
        
        ALTER TABLE orders DROP COLUMN total_price;
        RAISE NOTICE 'Dropped redundant column "total_price" as "total_amount" already exists.';

    -- Scenario 2: Only 'total_price' exists. This is the expected legacy state.
    -- We rename it to 'total_amount'.
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'total_price') THEN
        
        ALTER TABLE orders RENAME COLUMN total_price TO total_amount;
        RAISE NOTICE 'Renamed column "total_price" to "total_amount".';

    -- Scenario 3: 'total_amount' does NOT exist (and neither does 'total_price').
    -- We create the 'total_amount' column.
    ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'total_amount') THEN
        
        ALTER TABLE orders ADD COLUMN total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0;
        RAISE NOTICE 'Added column "total_amount" as it did not exist.';
        
    -- Scenario 4: Only 'total_amount' exists. The state is already correct.
    -- Do nothing.
    ELSE
        RAISE NOTICE 'Column "total_amount" already exists and is correctly configured. No action needed.';
    END IF;
END $$;

-- Final verification of the column
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'orders' AND column_name = 'total_amount';

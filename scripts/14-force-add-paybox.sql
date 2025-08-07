-- First, let's check current enum values
SELECT enumlabel as current_payment_methods 
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'payment_method_type')
ORDER BY enumsortorder;

-- Force add paybox if it doesn't exist
DO $$
BEGIN
    -- Check if paybox already exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'paybox' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'payment_method_type')
    ) THEN
        -- Add the new enum value
        ALTER TYPE payment_method_type ADD VALUE 'paybox';
        RAISE NOTICE 'Added paybox to payment_method_type enum';
    ELSE
        RAISE NOTICE 'paybox already exists in payment_method_type enum';
    END IF;
END $$;

-- Verify the result
SELECT enumlabel as final_payment_methods 
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'payment_method_type')
ORDER BY enumsortorder;

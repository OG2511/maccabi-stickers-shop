-- Add 'paybox' to the payment_method_type enum
ALTER TYPE payment_method_type ADD VALUE IF NOT EXISTS 'paybox';

-- Verify the enum values
SELECT unnest(enum_range(NULL::payment_method_type)) as payment_methods;

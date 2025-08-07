-- Remove graffiti collection and all related products
-- First, delete all products in the graffiti collection
DELETE FROM products WHERE collection = 'גרפיטי';

-- Remove the graffiti value from the collection enum
-- Note: This requires recreating the enum without the graffiti value
DO $$
BEGIN
    -- Create a new enum without graffiti
    CREATE TYPE collection_enum_new AS ENUM (
        '110 שנים למכבי חיפה',
        'Green Apes On Tour',
        'אליפות 20/21',
        'אליפות וכוכב',
        'בשביל כל האחים',
        'סדרת העשרים',
        'סדרת האסים',
        'סדרת רטרו',
        'קופים 2021',
        'קופים 2024',
        'מיוחדים'
    );

    -- Update the products table to use the new enum
    ALTER TABLE products ALTER COLUMN collection TYPE collection_enum_new USING collection::text::collection_enum_new;

    -- Drop the old enum
    DROP TYPE collection_enum;

    -- Rename the new enum to the original name
    ALTER TYPE collection_enum_new RENAME TO collection_enum;

    RAISE NOTICE 'Successfully removed graffiti collection from enum and deleted all graffiti products';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error removing graffiti collection: %', SQLERRM;
END $$;

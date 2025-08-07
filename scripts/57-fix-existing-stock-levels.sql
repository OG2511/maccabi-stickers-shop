-- תיקון רמות המלאי הקיימות על בסיס ההזמנות המאושרות
DO $$
DECLARE
    product_record RECORD;
    confirmed_qty INTEGER;
    original_stock INTEGER;
    new_stock INTEGER;
    total_fixed INTEGER := 0;
BEGIN
    RAISE NOTICE '🔧 מתקן רמות מלאי קיימות...';
    RAISE NOTICE '';
    
    -- עבור כל מוצר
    FOR product_record IN SELECT * FROM products ORDER BY collection, name LOOP
        -- חישוב כמות הזמנות מאושרות
        SELECT COALESCE(SUM(oi.quantity), 0) INTO confirmed_qty
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE oi.product_id = product_record.id 
        AND o.status = 'confirmed';
        
        -- נניח שהמלאי המקורי היה המלאי הנוכחי + ההזמנות המאושרות
        original_stock := product_record.stock + confirmed_qty;
        new_stock := original_stock - confirmed_qty;
        
        -- עדכון המלאי אם שונה
        IF new_stock != product_record.stock THEN
            UPDATE products 
            SET stock = new_stock
            WHERE id = product_record.id;
            
            total_fixed := total_fixed + 1;
            
            RAISE NOTICE '📦 %: % → % (מקורי: %, מאושר: %)', 
                product_record.name,
                product_record.stock,
                new_stock,
                original_stock,
                confirmed_qty;
        END IF;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '✅ תיקון הושלם! % מוצרים תוקנו', total_fixed;
END $$;

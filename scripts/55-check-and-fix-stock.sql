-- בדיקה ותיקון של מלאי קופים 2021-4
DO $$
DECLARE
    product_record RECORD;
    confirmed_orders INTEGER;
    current_stock INTEGER;
    expected_stock INTEGER;
BEGIN
    RAISE NOTICE '🔍 בודק מלאי של קופים 2021-4...';
    
    -- מציאת המוצר
    SELECT * INTO product_record 
    FROM products 
    WHERE name ILIKE '%קופים 2021%' AND name ILIKE '%4%'
    LIMIT 1;
    
    IF product_record.id IS NOT NULL THEN
        -- חישוב הזמנות מאושרות
        SELECT COALESCE(SUM(oi.quantity), 0) INTO confirmed_orders
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE oi.product_id = product_record.id 
        AND o.status = 'confirmed';
        
        current_stock := product_record.stock;
        expected_stock := 6; -- המלאי המקורי שהיה
        
        RAISE NOTICE '📊 נתוני המוצר:';
        RAISE NOTICE '   שם: %', product_record.name;
        RAISE NOTICE '   מלאי נוכחי: %', current_stock;
        RAISE NOTICE '   הזמנות מאושרות: %', confirmed_orders;
        RAISE NOTICE '   מלאי צפוי: % (6 - %)', expected_stock - confirmed_orders, confirmed_orders;
        
        -- תיקון המלאי אם נדרש
        IF current_stock != expected_stock THEN
            RAISE NOTICE '⚠️ מלאי לא תקין! מתקן ל-6...';
            
            UPDATE products 
            SET stock = expected_stock
            WHERE id = product_record.id;
            
            RAISE NOTICE '✅ מלאי תוקן ל-6';
        ELSE
            RAISE NOTICE '✅ מלאי תקין';
        END IF;
    ELSE
        RAISE NOTICE '❌ לא נמצא מוצר קופים 2021-4';
    END IF;
    
    -- סקירה כללית של מוצרים עם מלאי נמוך
    RAISE NOTICE '';
    RAISE NOTICE '📋 מוצרים עם מלאי נמוך (פחות מ-3):';
    
    FOR product_record IN 
        SELECT name, stock, collection 
        FROM products 
        WHERE stock < 3 
        ORDER BY stock ASC, name
    LOOP
        RAISE NOTICE '   • % (%) - מלאי: %', 
            product_record.name, 
            product_record.collection, 
            product_record.stock;
    END LOOP;
END $$;

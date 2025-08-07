-- דוח מלאי מקורי מפורט של כל המדבקות
DO $$
DECLARE
    product_record RECORD;
    collection_record RECORD;
    confirmed_qty INTEGER;
    pending_qty INTEGER;
    rejected_qty INTEGER;
    total_qty INTEGER;
    original_stock INTEGER;
    total_value DECIMAL(10,2);
    grand_total_original INTEGER := 0;
    grand_total_current INTEGER := 0;
    grand_total_value DECIMAL(10,2) := 0;
BEGIN
    RAISE NOTICE '📊 ===== דוח המלאי המקורי המלא =====';
    RAISE NOTICE '';
    RAISE NOTICE 'תאריך: %', NOW()::DATE;
    RAISE NOTICE 'שעה: %', NOW()::TIME;
    RAISE NOTICE '';
    
    -- כותרת הטבלה
    RAISE NOTICE '%-40s | %-15s | %8s | %8s | %6s | %6s | %6s | %8s | %10s', 
        'שם המדבקה', 'קולקציה', 'מקורי', 'נוכחי', 'מאושר', 'ממתין', 'נדחה', 'ערך ₪', 'הזמנות';
    RAISE NOTICE '%', REPEAT('-', 120);
    
    -- עבור כל מוצר
    FOR product_record IN 
        SELECT * FROM products 
        ORDER BY collection, name 
    LOOP
        -- חישוב הזמנות לפי סטטוס
        SELECT 
            COALESCE(SUM(CASE WHEN o.status = 'confirmed' THEN oi.quantity ELSE 0 END), 0),
            COALESCE(SUM(CASE WHEN o.status = 'pending' THEN oi.quantity ELSE 0 END), 0),
            COALESCE(SUM(CASE WHEN o.status = 'rejected' THEN oi.quantity ELSE 0 END), 0),
            COALESCE(SUM(oi.quantity), 0)
        INTO confirmed_qty, pending_qty, rejected_qty, total_qty
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE oi.product_id = product_record.id;
        
        -- המלאי המקורי המשוער
        original_stock := product_record.stock + confirmed_qty;
        
        -- ערך המלאי הנוכחי
        total_value := product_record.stock * product_record.price;
        
        -- הדפסת השורה
        RAISE NOTICE '%-40s | %-15s | %8s | %8s | %6s | %6s | %6s | %8s | %10s', 
            LEFT(product_record.name, 40),
            LEFT(product_record.collection, 15),
            original_stock,
            product_record.stock,
            confirmed_qty,
            pending_qty,
            rejected_qty,
            ROUND(total_value, 0)::TEXT || '₪',
            total_qty;
            
        -- צבירה לסיכום
        grand_total_original := grand_total_original + original_stock;
        grand_total_current := grand_total_current + product_record.stock;
        grand_total_value := grand_total_value + total_value;
    END LOOP;
    
    RAISE NOTICE '%', REPEAT('-', 120);
    RAISE NOTICE 'סה"כ: %51s | %8s | %8s | %32s', 
        '', 
        grand_total_original, 
        grand_total_current,
        ROUND(grand_total_value, 0)::TEXT || '₪';
    
    RAISE NOTICE '';
    RAISE NOTICE '📈 ===== סיכום לפי קולקציה =====';
    RAISE NOTICE '';
    
    -- סיכום לפי קולקציה
    FOR collection_record IN 
        SELECT 
            collection,
            COUNT(*) as product_count,
            SUM(stock) as current_total,
            SUM(stock * price) as collection_value
        FROM products 
        GROUP BY collection 
        ORDER BY collection 
    LOOP
        RAISE NOTICE '🏷️  %: % מוצרים | מלאי נוכחי: % | ערך: %₪', 
            collection_record.collection,
            collection_record.product_count,
            collection_record.current_total,
            ROUND(collection_record.collection_value, 0);
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '💰 ===== סיכום כספי =====';
    RAISE NOTICE 'סה"כ מלאי מקורי משוער: % יחידות', grand_total_original;
    RAISE NOTICE 'סה"כ מלאי נוכחי: % יחידות', grand_total_current;
    RAISE NOTICE 'סה"כ ערך מלאי נוכחי: %₪', ROUND(grand_total_value, 0);
    RAISE NOTICE 'יחידות שנמכרו: %', grand_total_original - grand_total_current;
    
    IF grand_total_original > 0 THEN
        RAISE NOTICE 'אחוז מכירות: %%%', 
            ROUND(((grand_total_original - grand_total_current)::DECIMAL / grand_total_original * 100), 1);
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '✅ דוח הושלם בהצלחה!';
END $$;

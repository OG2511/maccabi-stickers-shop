-- יצירת פונקציה לעדכון מלאי אוטומטי
CREATE OR REPLACE FUNCTION update_product_stock()
RETURNS TRIGGER AS $$
BEGIN
    -- כשמאשרים הזמנה - מורידים מהמלאי
    IF NEW.status = 'confirmed' AND OLD.status != 'confirmed' THEN
        UPDATE products 
        SET stock = stock - (
            SELECT COALESCE(SUM(quantity), 0) 
            FROM order_items 
            WHERE order_id = NEW.id
        )
        WHERE id IN (
            SELECT product_id 
            FROM order_items 
            WHERE order_id = NEW.id
        );
        
        RAISE NOTICE 'הזמנה % אושרה - מלאי עודכן', NEW.id;
        
    -- כשדוחים הזמנה מאושרת - מחזירים למלאי
    ELSIF NEW.status = 'rejected' AND OLD.status = 'confirmed' THEN
        UPDATE products 
        SET stock = stock + (
            SELECT COALESCE(SUM(quantity), 0) 
            FROM order_items 
            WHERE order_id = NEW.id
        )
        WHERE id IN (
            SELECT product_id 
            FROM order_items 
            WHERE order_id = NEW.id
        );
        
        RAISE NOTICE 'הזמנה % נדחתה - מלאי הוחזר', NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- יצירת הטריגר
DROP TRIGGER IF EXISTS stock_update_trigger ON orders;
CREATE TRIGGER stock_update_trigger
    AFTER UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_product_stock();

-- הודעה על הצלחה
DO $$
BEGIN
    RAISE NOTICE '✅ טריגר עדכון מלאי נוצר בהצלחה!';
    RAISE NOTICE '📝 מעכשיו המלאי יתעדכן אוטומטית כשמאשרים/דוחים הזמנות';
END $$;

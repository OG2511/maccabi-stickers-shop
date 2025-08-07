-- בדיקת נתונים מפורטת עבור מוצר ספציפי
-- נבדוק את המוצר "קופים 2021 - 4"

-- 1. נמצא את המוצר ונראה את המלאי הנוכחי
SELECT 
    id,
    name,
    stock as current_stock,
    collection,
    price
FROM products 
WHERE name ILIKE '%קופים 2021%4%' OR name ILIKE '%קופים%2021%';

-- 2. נמצא את כל ההזמנות שכוללות את המוצר הזה
WITH product_orders AS (
    SELECT 
        p.id as product_id,
        p.name as product_name,
        p.stock as current_stock,
        o.id as order_id,
        o.customer_name,
        o.status as order_status,
        o.created_at,
        oi.quantity as ordered_quantity
    FROM products p
    JOIN order_items oi ON p.id = oi.product_id
    JOIN orders o ON oi.order_id = o.id
    WHERE p.name ILIKE '%קופים 2021%4%' OR p.name ILIKE '%קופים%2021%'
)
SELECT 
    product_name,
    current_stock,
    order_id,
    customer_name,
    order_status,
    ordered_quantity,
    created_at
FROM product_orders
ORDER BY created_at DESC;

-- 3. חישוב סיכום עבור המוצר
WITH product_summary AS (
    SELECT 
        p.id as product_id,
        p.name as product_name,
        p.stock as current_stock,
        COALESCE(SUM(oi.quantity), 0) as total_ordered,
        COALESCE(SUM(CASE WHEN o.status = 'confirmed' THEN oi.quantity ELSE 0 END), 0) as confirmed_ordered,
        COALESCE(SUM(CASE WHEN o.status = 'pending' THEN oi.quantity ELSE 0 END), 0) as pending_ordered,
        COALESCE(SUM(CASE WHEN o.status = 'rejected' THEN oi.quantity ELSE 0 END), 0) as rejected_ordered
    FROM products p
    LEFT JOIN order_items oi ON p.id = oi.product_id
    LEFT JOIN orders o ON oi.order_id = o.id
    WHERE p.name ILIKE '%קופים 2021%4%' OR p.name ILIKE '%קופים%2021%'
    GROUP BY p.id, p.name, p.stock
)
SELECT 
    product_name,
    current_stock,
    total_ordered,
    confirmed_ordered,
    pending_ordered,
    rejected_ordered,
    (total_ordered - current_stock) as calculated_overstock,
    CASE 
        WHEN total_ordered > current_stock THEN 'יש בעיה - הוזמן יותר מהמלאי'
        ELSE 'אין בעיה - המלאי מספיק'
    END as status
FROM product_summary;

-- 4. בדיקה כללית של כל המוצרים עם בעיות מלאי
SELECT 
    p.name,
    p.stock as current_stock,
    COALESCE(SUM(oi.quantity), 0) as total_ordered,
    COALESCE(SUM(CASE WHEN o.status = 'confirmed' THEN oi.quantity ELSE 0 END), 0) as confirmed_ordered,
    COALESCE(SUM(CASE WHEN o.status = 'pending' THEN oi.quantity ELSE 0 END), 0) as pending_ordered,
    (COALESCE(SUM(oi.quantity), 0) - p.stock) as overstock
FROM products p
LEFT JOIN order_items oi ON p.id = oi.product_id
LEFT JOIN orders o ON oi.order_id = o.id
GROUP BY p.id, p.name, p.stock
HAVING COALESCE(SUM(oi.quantity), 0) > p.stock
ORDER BY (COALESCE(SUM(oi.quantity), 0) - p.stock) DESC;

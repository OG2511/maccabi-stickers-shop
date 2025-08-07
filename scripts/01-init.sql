-- Create a type for sticker collections
CREATE TYPE collection_type AS ENUM (
    '110 שנים למכבי חיפה',
    'Green Apes On Tour',
    'אליפות 20/21',
    'אליפות וכוכב',
    'בשביל כל האחים',
    'סדרת האסים',
    'סדרת העשרים',
    'סדרת רטרו',
    'קופים 2021',
    'קופים 2024',
    'כלליים',
    'מיוחדים'
);

-- Create products table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    collection collection_type NOT NULL,
    stock INT NOT NULL,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create a type for order status
CREATE TYPE order_status_type AS ENUM ('pending', 'confirmed', 'shipped');

-- Create a type for delivery options
CREATE TYPE delivery_option_type AS ENUM ('self_pickup', 'israel_post');

-- Create a type for payment methods
CREATE TYPE payment_method_type AS ENUM ('bit', 'paypal');

-- Create orders table
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    delivery_option delivery_option_type NOT NULL,
    city TEXT,
    street TEXT,
    house_number TEXT,
    zip_code TEXT,
    total_price NUMERIC(10, 2) NOT NULL,
    status order_status_type DEFAULT 'pending',
    payment_method payment_method_type NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create order_items table to link products and orders
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    quantity INT NOT NULL,
    price_per_item NUMERIC(10, 2) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Policies for public access (read-only for products)
CREATE POLICY "Public can read products" ON products FOR SELECT USING (true);

-- Policies for admin access (full control)
-- This allows any authenticated user to manage data.
-- For production, you should restrict this to specific admin roles.
CREATE POLICY "Admins can manage all data" ON products FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage all orders" ON orders FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage all order items" ON order_items FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Insert some sample data
INSERT INTO products (name, price, collection, stock, image_url) VALUES
('סטיקר קוף ירוק', 5.00, 'Green Apes On Tour', 100, '/placeholder.svg?width=400&height=400'),
('סטיקר אליפות 20/21', 5.00, 'אליפות 20/21', 100, '/placeholder.svg?width=400&height=400'),
('סטיקר רטרו לוגו', 5.00, 'סדרת רטרו', 50, '/placeholder.svg?width=400&height=400'),
('סטיקר מיוחד זהב', 10.00, 'מיוחדים', 20, '/placeholder.svg?width=400&height=400');

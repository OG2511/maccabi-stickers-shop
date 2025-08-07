-- Drop existing policies
DROP POLICY IF EXISTS "Public can read products" ON products;
DROP POLICY IF EXISTS "Admins can manage all data" ON products;
DROP POLICY IF EXISTS "Admins can manage all orders" ON orders;
DROP POLICY IF EXISTS "Admins can manage all order items" ON order_items;

-- Create new, more permissive policies for testing
-- Note: In production, you should use proper role-based access control

-- Allow public read access to products
CREATE POLICY "Anyone can read products" ON products FOR SELECT USING (true);

-- Allow authenticated users to do everything with products
CREATE POLICY "Authenticated users can manage products" ON products FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Allow authenticated users to manage orders
CREATE POLICY "Authenticated users can manage orders" ON orders FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Allow authenticated users to manage order items
CREATE POLICY "Authenticated users can manage order items" ON order_items FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Also allow unauthenticated users to create orders (for checkout)
CREATE POLICY "Anyone can create orders" ON orders FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can create order items" ON order_items FOR INSERT
WITH CHECK (true);

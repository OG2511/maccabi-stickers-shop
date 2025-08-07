-- Add sample images to products with correct collection names from the enum
UPDATE products SET image_url = '/background1.jpg' WHERE collection = 'מיוחדים' AND image_url IS NULL;
UPDATE products SET image_url = '/background2.jpg' WHERE collection = 'סדרת האסים' AND image_url IS NULL;
UPDATE products SET image_url = '/background3.jpg' WHERE collection = 'קופים 2024' AND image_url IS NULL;
UPDATE products SET image_url = '/background4.jpg' WHERE collection = 'קופים 2021' AND image_url IS NULL;
UPDATE products SET image_url = '/background5.jpg' WHERE collection = 'סדרת העשרים' AND image_url IS NULL;

-- Add more images for other collections
UPDATE products SET image_url = '/background1.jpg' WHERE collection = '110 שנים למכבי חיפה' AND image_url IS NULL;
UPDATE products SET image_url = '/background2.jpg' WHERE collection = 'Green Apes On Tour' AND image_url IS NULL;
UPDATE products SET image_url = '/background3.jpg' WHERE collection = 'אליפות 20/21' AND image_url IS NULL;
UPDATE products SET image_url = '/background4.jpg' WHERE collection = 'אליפות וכוכב' AND image_url IS NULL;
UPDATE products SET image_url = '/background5.jpg' WHERE collection = 'בשביל כל האחים' AND image_url IS NULL;
UPDATE products SET image_url = '/background1.jpg' WHERE collection = 'סדרת רטרו' AND image_url IS NULL;

-- Add default images for any remaining products without images
UPDATE products SET image_url = '/placeholder.svg?height=400&width=400&text=' || REPLACE(name, ' ', '+') WHERE image_url IS NULL;

-- Verify the update
SELECT id, name, collection, image_url FROM products ORDER BY collection, name;

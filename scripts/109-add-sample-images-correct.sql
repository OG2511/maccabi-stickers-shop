-- Add sample images to existing products with correct collection names
UPDATE products SET image_url = '/placeholder.svg?height=400&width=400&text=110+Years+Maccabi+Haifa' 
WHERE collection = '110 שנים למכבי חיפה' AND image_url IS NULL;

UPDATE products SET image_url = '/placeholder.svg?height=400&width=400&text=Green+Apes+On+Tour' 
WHERE collection = 'Green Apes On Tour' AND image_url IS NULL;

UPDATE products SET image_url = '/placeholder.svg?height=400&width=400&text=Championship+20-21' 
WHERE collection = 'אליפות 20/21' AND image_url IS NULL;

UPDATE products SET image_url = '/placeholder.svg?height=400&width=400&text=Championship+Star' 
WHERE collection = 'אליפות וכוכב' AND image_url IS NULL;

UPDATE products SET image_url = '/placeholder.svg?height=400&width=400&text=For+All+Brothers' 
WHERE collection = 'בשביל כל האחים' AND image_url IS NULL;

UPDATE products SET image_url = '/placeholder.svg?height=400&width=400&text=Twenty+Series' 
WHERE collection = 'סדרת העשרים' AND image_url IS NULL;

UPDATE products SET image_url = '/placeholder.svg?height=400&width=400&text=Aces+Series' 
WHERE collection = 'סדרת האסים' AND image_url IS NULL;

UPDATE products SET image_url = '/placeholder.svg?height=400&width=400&text=Retro+Series' 
WHERE collection = 'סדרת רטרו' AND image_url IS NULL;

UPDATE products SET image_url = '/placeholder.svg?height=400&width=400&text=Monkeys+2021' 
WHERE collection = 'קופים 2021' AND image_url IS NULL;

UPDATE products SET image_url = '/placeholder.svg?height=400&width=400&text=Monkeys+2024' 
WHERE collection = 'קופים 2024' AND image_url IS NULL;

UPDATE products SET image_url = '/placeholder.svg?height=400&width=400&text=Special+Stickers' 
WHERE collection = 'מיוחדים' AND image_url IS NULL;

-- Verify the update
SELECT collection, COUNT(*) as count, 
       COUNT(CASE WHEN image_url IS NOT NULL THEN 1 END) as with_images
FROM products 
GROUP BY collection 
ORDER BY collection;

export type Product = {
  id: string
  name: string
  price: number
  collection: string
  stock: number
  image_url: string
  created_at: string
}

export type CartItem = {
  product: Product
  quantity: number
}

// Define all available collections - ללא גרפיטי
export const COLLECTIONS = [
  "110 שנים למכבי חיפה",
  "Green Apes On Tour",
  "אליפות 20/21",
  "אליפות וכוכב",
  "בשביל כל האחים",
  "סדרת העשרים",
  "סדרת האסים", // תוצג כ"מ.ח. 22"
  "סדרת רטרו",
  "קופים 2021",
  "קופים 2024",
  "מיוחדים",
] as const

export type CollectionType = (typeof COLLECTIONS)[number]

// Collection display mapping - ללא גרפיטי
export const COLLECTION_DISPLAY_NAMES: Record<string, string> = {
  "110 שנים למכבי חיפה": "110 שנים למכבי חיפה",
  "Green Apes On Tour": "Green Apes On Tour",
  "אליפות 20/21": "אליפות 20/21",
  "אליפות וכוכב": "אליפות וכוכב",
  "בשביל כל האחים": "בשביל כל האחים",
  "סדרת העשרים": "סדרת העשרים",
  "סדרת האסים": "מ.ח. 22",
  "סדרת רטרו": "סדרת רטרו",
  "קופים 2021": "קופים 2021",
  "קופים 2024": "קופים 2024",
  מיוחדים: "מיוחדים",
}

// Helper function to get display name
export function getCollectionDisplayName(collection: string): string {
  return COLLECTION_DISPLAY_NAMES[collection] || collection
}

// Helper function to get DB value from display name (useful for admin forms)
export function getCollectionDbValue(displayName: string): string {
  const entry = Object.entries(COLLECTION_DISPLAY_NAMES).find(([_, display]) => display === displayName)
  return entry ? entry[0] : displayName
}

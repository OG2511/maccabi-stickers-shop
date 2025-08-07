"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Plus } from "lucide-react"
import { COLLECTIONS, COLLECTION_DISPLAY_NAMES } from "@/lib/types"
import { useRouter } from "next/navigation"

export function AddProductDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    collection: "",
    stock: "",
    image_url: "",
  })
  const { toast } = useToast()
  const router = useRouter()

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    console.log("🔵 ADD PRODUCT: Starting product addition")
    console.log("🔵 ADD PRODUCT: Form data:", formData)

    try {
      const response = await fetch("/api/admin/products/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          price: Number.parseFloat(formData.price),
          collection: formData.collection,
          stock: Number.parseInt(formData.stock),
          image_url: formData.image_url || null,
        }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        console.log("✅ ADD PRODUCT: Product added successfully")
        toast({
          title: "הצלחה",
          description: "המוצר נוסף בהצלחה",
        })

        // Reset form
        setFormData({
          name: "",
          price: "",
          collection: "",
          stock: "",
          image_url: "",
        })

        setOpen(false)

        // Refresh the page to show updated data
        router.refresh()
      } else {
        console.error("❌ ADD PRODUCT: Failed to add product:", result.error)
        toast({
          title: "שגיאה",
          description: result.error || "שגיאה בהוספת המוצר",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("❌ ADD PRODUCT: Network error:", error)
      toast({
        title: "שגיאה",
        description: "שגיאת רשת בהוספת המוצר",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 ml-2" />
          הוסף מוצר
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>הוסף מוצר חדש</DialogTitle>
          <DialogDescription>הזן את פרטי המוצר החדש</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                שם המוצר
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className="col-span-3"
                required
                disabled={loading}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="price" className="text-right">
                מחיר (₪)
              </Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => handleInputChange("price", e.target.value)}
                className="col-span-3"
                required
                disabled={loading}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="collection" className="text-right">
                קולקציה
              </Label>
              <Select
                value={formData.collection}
                onValueChange={(value) => handleInputChange("collection", value)}
                required
                disabled={loading}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="בחר קולקציה" />
                </SelectTrigger>
                <SelectContent>
                  {COLLECTIONS.map((collection) => (
                    <SelectItem key={collection} value={collection}>
                      {COLLECTION_DISPLAY_NAMES[collection] || collection}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="stock" className="text-right">
                מלאי
              </Label>
              <Input
                id="stock"
                type="number"
                value={formData.stock}
                onChange={(e) => handleInputChange("stock", e.target.value)}
                className="col-span-3"
                required
                disabled={loading}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="image_url" className="text-right">
                קישור לתמונה
              </Label>
              <Input
                id="image_url"
                type="url"
                value={formData.image_url}
                onChange={(e) => handleInputChange("image_url", e.target.value)}
                className="col-span-3"
                disabled={loading}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="submit"
              disabled={loading || !formData.name || !formData.price || !formData.collection || !formData.stock}
            >
              {loading ? "מוסיף..." : "הוסף מוצר"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

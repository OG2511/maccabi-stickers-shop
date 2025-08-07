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
import { Edit } from "lucide-react"
import type { Product } from "@/lib/types"
import { COLLECTIONS, COLLECTION_DISPLAY_NAMES } from "@/lib/types"
import { useRouter } from "next/navigation"

interface EditProductDialogProps {
  product: Product
}

export function EditProductDialog({ product }: EditProductDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: product.name,
    price: product.price.toString(),
    collection: product.collection,
    stock: product.stock.toString(),
    image_url: product.image_url || "",
  })
  const { toast } = useToast()
  const router = useRouter()

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    console.log("🟡 EDIT PRODUCT: Starting product update")
    console.log("🟡 EDIT PRODUCT: Form data:", formData)

    try {
      const response = await fetch("/api/admin/products/edit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: product.id,
          name: formData.name,
          price: Number.parseFloat(formData.price),
          collection: formData.collection,
          stock: Number.parseInt(formData.stock),
          image_url: formData.image_url || null,
        }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        console.log("✅ EDIT PRODUCT: Product updated successfully")
        toast({
          title: "הצלחה",
          description: "המוצר עודכן בהצלחה",
        })

        setOpen(false)

        // Refresh the page to show updated data
        router.refresh()
      } else {
        console.error("❌ EDIT PRODUCT: Failed to update product:", result.error)
        toast({
          title: "שגיאה",
          description: result.error || "שגיאה בעדכון המוצר",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("❌ EDIT PRODUCT: Network error:", error)
      toast({
        title: "שגיאה",
        description: "שגיאת רשת בעדכון המוצר",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit className="h-4 w-4 ml-2" />
          ערוך
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>ערוך מוצר</DialogTitle>
          <DialogDescription>עדכן את פרטי המוצר</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                שם המוצר
              </Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className="col-span-3"
                required
                disabled={loading}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-price" className="text-right">
                מחיר (₪)
              </Label>
              <Input
                id="edit-price"
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
              <Label htmlFor="edit-collection" className="text-right">
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
              <Label htmlFor="edit-stock" className="text-right">
                מלאי
              </Label>
              <Input
                id="edit-stock"
                type="number"
                value={formData.stock}
                onChange={(e) => handleInputChange("stock", e.target.value)}
                className="col-span-3"
                required
                disabled={loading}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-image_url" className="text-right">
                קישור לתמונה
              </Label>
              <Input
                id="edit-image_url"
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
              {loading ? "מעדכן..." : "עדכן מוצר"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

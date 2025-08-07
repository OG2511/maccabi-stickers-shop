"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Trash2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

interface DeleteProductButtonProps {
  productId: string
  productName: string
  onSuccess?: () => void
}

export function DeleteProductButton({ productId, productName, onSuccess }: DeleteProductButtonProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleDelete = async () => {
    setIsLoading(true)

    try {
      console.log("🔴 Deleting product:", productId)

      const response = await fetch("/api/admin/products/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productId }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        console.log("✅ Product deleted successfully")
        toast({
          title: "הצלחה",
          description: "המוצר נמחק בהצלחה",
        })
        setOpen(false)

        // Refresh the page to show updated data
        router.refresh()

        if (onSuccess) {
          onSuccess()
        }
      } else {
        console.error("❌ Failed to delete product:", result.error)
        toast({
          title: "שגיאה",
          description: result.error || "שגיאה במחיקת המוצר",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("❌ Network error:", error)
      toast({
        title: "שגיאה",
        description: "שגיאת רשת במחיקת המוצר",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={isLoading}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>האם אתה בטוח?</AlertDialogTitle>
          <AlertDialogDescription>
            פעולה זו תמחק את המוצר "{productName}" לצמיתות ולא ניתן לבטל אותה.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>ביטול</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isLoading}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isLoading ? "מוחק..." : "מחק"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

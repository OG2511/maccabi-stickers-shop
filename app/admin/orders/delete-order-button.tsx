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
import { deleteOrderAction } from "./actions"

// Update the interface to include onSuccess callback
interface DeleteOrderButtonProps {
  orderId: string
  orderNumber: string
  onSuccess?: () => void
}

export function DeleteOrderButton({ orderId, orderNumber, onSuccess }: DeleteOrderButtonProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleDelete = async () => {
    setIsLoading(true)

    const formData = new FormData()
    formData.append("orderId", orderId)

    try {
      const result = await deleteOrderAction(formData)

      if (result.success) {
        toast({
          title: "הצלחה",
          description: "ההזמנה נמחקה בהצלחה",
        })
        setOpen(false)
        onSuccess?.()
      } else {
        toast({
          title: "שגיאה",
          description: result.error || "שגיאה במחיקת ההזמנה",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting order:", error)
      toast({
        title: "שגיאה",
        description: "שגיאה במחיקת ההזמנה",
        variant: "destructive",
      })
    }

    setIsLoading(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent aria-describedby="delete-order-description">
        <AlertDialogHeader>
          <AlertDialogTitle>האם אתה בטוח?</AlertDialogTitle>
          <AlertDialogDescription id="delete-order-description">
            פעולה זו תמחק את הזמנה #{orderNumber} לצמיתות ולא ניתן לבטל אותה. כל פרטי ההזמנה והפריטים שלה יימחקו
            מהמערכת.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>ביטול</AlertDialogCancel>
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

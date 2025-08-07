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
import { bulkDeleteOrdersAction } from "./actions"
import { Trash2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface BulkDeleteButtonProps {
  selectedOrders: Set<string>
  onSuccess: () => void
}

export function BulkDeleteButton({ selectedOrders, onSuccess }: BulkDeleteButtonProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleDelete = async () => {
    setIsLoading(true)

    const formData = new FormData()
    formData.append("orderIds", JSON.stringify(Array.from(selectedOrders)))

    try {
      const result = await bulkDeleteOrdersAction(formData)

      if (result.success) {
        toast({
          title: "הצלחה",
          description: `${selectedOrders.size} הזמנות נמחקו בהצלחה`,
        })
        setOpen(false)
        onSuccess()
      } else {
        toast({
          title: "שגיאה",
          description: result.error || "שגיאה במחיקת ההזמנות",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting orders:", error)
      toast({
        title: "שגיאה",
        description: "שגיאה במחיקת ההזמנות",
        variant: "destructive",
      })
    }

    setIsLoading(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <Trash2 className="h-4 w-4 ml-2" />
          מחק נבחרות ({selectedOrders.size})
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent aria-describedby="bulk-delete-description">
        <AlertDialogHeader>
          <AlertDialogTitle>מחיקת הזמנות מרובות</AlertDialogTitle>
          <AlertDialogDescription id="bulk-delete-description">
            האם אתה בטוח שברצונך למחוק {selectedOrders.size} הזמנות? פעולה זו תמחק את כל ההזמנות הנבחרות לצמיתות ולא
            ניתן לבטל אותה. כל פרטי ההזמנות והפריטים שלהן יימחקו מהמערכת.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>ביטול</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isLoading}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isLoading ? "מוחק..." : `מחק ${selectedOrders.size} הזמנות`}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

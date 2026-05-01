import * as React from "react"
import { AlertCircle, Loader2 } from "lucide-react"
import { ResponsiveModal } from "./ResponsiveModal"
import { Button } from "./button"
import { DialogFooter } from "./dialog"
import { cn } from "@/lib/utils"

interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: "danger" | "warning" | "info"
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Xác nhận",
  cancelText = "Hủy bỏ",
  variant = "danger",
}: ConfirmModalProps) {
  const [loading, setLoading] = React.useState(false)

  const handleConfirm = async () => {
    setLoading(true)
    try {
      await onConfirm()
      onClose()
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const variantStyles = {
    danger: "bg-red-600 hover:bg-red-700 shadow-red-100",
    warning: "bg-orange-500 hover:bg-orange-600 shadow-orange-100",
    info: "bg-sky-600 hover:bg-sky-700 shadow-sky-100",
  }

  const iconStyles = {
    danger: "bg-red-50 text-red-600 border-red-100",
    warning: "bg-orange-50 text-orange-600 border-orange-100",
    info: "bg-sky-50 text-sky-600 border-sky-100",
  }

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onOpenChange={onClose}
      maxWidth="sm"
      footer={
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl font-bold h-12 px-6"
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className={cn(
              "text-white rounded-xl font-black h-12 px-8 shadow-lg transition-all",
              variantStyles[variant]
            )}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {confirmText}
          </Button>
        </DialogFooter>
      }
    >
      <div className="flex flex-col items-center text-center py-4">
        <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mb-6 border animate-in zoom-in duration-300", iconStyles[variant])}>
          <AlertCircle size={32} />
        </div>
        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">
          {title}
        </h3>
        <p className="text-sm font-medium text-slate-500 leading-relaxed max-w-[280px]">
          {description}
        </p>
      </div>
    </ResponsiveModal>
  )
}

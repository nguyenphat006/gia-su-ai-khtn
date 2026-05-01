import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

interface ResponsiveModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  children: React.ReactNode
  className?: string
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "full"
  header?: React.ReactNode
  footer?: React.ReactNode
}

const maxWidthMap = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-md",
  lg: "sm:max-w-lg",
  xl: "sm:max-w-xl",
  "2xl": "sm:max-w-2xl",
  "3xl": "sm:max-w-3xl",
  "4xl": "sm:max-w-4xl",
  "5xl": "sm:max-w-5xl",
  full: "sm:max-w-[95vw]",
}

export function ResponsiveModal({
  isOpen,
  onOpenChange,
  title,
  description,
  children,
  className,
  maxWidth = "2xl",
  header,
  footer,
}: ResponsiveModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent 
        className={cn(
          "w-[95vw] sm:w-full",
          maxWidthMap[maxWidth],
          "max-h-[90vh] p-0 gap-0",
          "rounded-[1.5rem] sm:rounded-[2rem] border-none shadow-2xl overflow-hidden flex flex-col",
          className
        )}
      >
        {header ? (
          <div className="shrink-0">{header}</div>
        ) : (title || description) ? (
          <DialogHeader className="p-6 pb-4 text-left border-b border-slate-50 shrink-0">
            {title && (
              <DialogTitle className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {title}
              </DialogTitle>
            )}
            {description && (
              <DialogDescription className="text-sm font-medium text-slate-500">
                {description}
              </DialogDescription>
            )}
          </DialogHeader>
        ) : null}

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          {children}
        </div>

        {footer && (
          <div className="p-6 border-t border-slate-100 shrink-0 bg-white/80 backdrop-blur-md z-10">
            {footer}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

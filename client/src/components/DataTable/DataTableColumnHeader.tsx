import { Column } from "@tanstack/react-table"
import { ArrowDown, ArrowUp, ChevronsUpDown, EyeOff } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface DataTableColumnHeaderProps<TData, TValue>
  extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>
  title: string
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return <div className={cn(className)}>{title}</div>
  }

  const isSorted = column.getIsSorted()

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8 data-[state=open]:bg-accent hover:bg-slate-100/50 text-[10px] font-black uppercase tracking-widest text-slate-500"
        onClick={() => {
            if (isSorted === "desc") column.clearSorting()
            else if (isSorted === "asc") column.toggleSorting(true)
            else column.toggleSorting(false)
        }}
      >
        <span>{title}</span>
        {isSorted === "desc" ? (
          <ArrowDown className="ml-2 h-3 w-3" />
        ) : isSorted === "asc" ? (
          <ArrowUp className="ml-2 h-3 w-3" />
        ) : (
          <ChevronsUpDown className="ml-2 h-3 w-3 opacity-50" />
        )}
      </Button>
    </div>
  )
}

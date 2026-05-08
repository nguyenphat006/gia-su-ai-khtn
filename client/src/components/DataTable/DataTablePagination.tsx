import { Table } from "@tanstack/react-table"
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface DataTablePaginationProps<TData> {
  table: Table<TData>
  totalCount?: number
}

export function DataTablePagination<TData>({
  table,
  totalCount,
}: DataTablePaginationProps<TData>) {
  const { pageIndex, pageSize } = table.getState().pagination
  const totalRows = totalCount ?? table.getFilteredRowModel().rows.length
  
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-4 bg-white/50 backdrop-blur-sm rounded-2xl border border-slate-100 shadow-sm">
      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center sm:text-left">
        <span className="hidden xs:inline">{table.getFilteredSelectedRowModel().rows.length} trên {totalRows} hàng được chọn.</span>
        <span className="xs:hidden">{table.getFilteredSelectedRowModel().rows.length}/{totalRows} chọn</span>
      </div>
      
      <div className="flex items-center gap-4 sm:gap-6 lg:gap-8">
        <div className="flex items-center space-x-2">
          <p className="hidden sm:block text-[10px] font-black text-slate-500 uppercase tracking-widest">Hàng/trang</p>
          <select
            value={pageSize}
            onChange={(e) => {
              table.setPageSize(Number(e.target.value))
            }}
            className="h-8 w-[65px] sm:w-[70px] bg-white border border-slate-200 rounded-lg text-[10px] sm:text-xs font-bold text-slate-700 focus:outline-none px-1 sm:px-2"
          >
            {[10, 20, 30, 40, 50].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-center text-[10px] font-black text-slate-600 uppercase tracking-widest min-w-[70px]">
          {pageIndex + 1} / {table.getPageCount()}
        </div>

        <div className="flex items-center space-x-1 sm:space-x-2">
          <Button
            variant="outline"
            className="hidden lg:flex h-8 w-8 p-0 border-slate-200 rounded-lg"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0 border-slate-200 rounded-lg"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0 border-slate-200 rounded-lg"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="hidden lg:flex h-8 w-8 p-0 border-slate-200 rounded-lg"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

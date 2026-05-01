import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  PaginationState,
} from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DataTablePagination } from "./DataTablePagination"
import Spinner from "@/components/ui/Spinner"
import { AlertCircle } from "lucide-react"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  pageCount?: number
  pagination?: PaginationState
  onPaginationChange?: React.Dispatch<React.SetStateAction<PaginationState>>
  sorting?: SortingState
  onSortingChange?: React.Dispatch<React.SetStateAction<SortingState>>
  loading?: boolean
  error?: string | null
  totalCount?: number
  meta?: any
  state?: any
  onRowSelectionChange?: any
}

export function DataTable<TData, TValue>({
  columns,
  data,
  pageCount,
  pagination,
  onPaginationChange,
  sorting,
  onSortingChange,
  loading,
  error,
  totalCount,
  meta,
  state: externalState,
  onRowSelectionChange: externalOnRowSelectionChange,
}: DataTableProps<TData, TValue>) {
  const [internalRowSelection, setInternalRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  
  // Internal pagination state for client-side mode
  const [internalPagination, setInternalPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })

  // Internal sorting state for client-side mode
  const [internalSorting, setInternalSorting] = React.useState<SortingState>([])

  const isServerSide = !!onPaginationChange

  const table = useReactTable({
    data,
    columns,
    pageCount: pageCount ?? -1,
    state: {
      pagination: pagination ?? internalPagination,
      sorting: sorting ?? internalSorting,
      rowSelection: externalState?.rowSelection ?? internalRowSelection,
      columnVisibility,
    },
    onPaginationChange: onPaginationChange ?? setInternalPagination,
    onSortingChange: onSortingChange ?? setInternalSorting,
    onRowSelectionChange: externalOnRowSelectionChange ?? setInternalRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    manualPagination: isServerSide,
    manualSorting: isServerSide,
    meta,
  })

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50/50">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent border-slate-200">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="text-slate-500 font-bold uppercase text-[10px] tracking-wider py-4 text-center">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <Spinner className="w-8 h-8 text-sky-500" />
                    <p className="text-sm font-bold text-slate-400 animate-pulse">Đang tải dữ liệu...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center gap-3 text-red-500">
                    <AlertCircle className="w-8 h-8" />
                    <p className="text-sm font-bold">Đã có lỗi xảy ra: {error}</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="border-slate-100 hover:bg-slate-50/50 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-4 text-sm font-medium text-slate-600 text-center">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-2">
                       <AlertCircle className="w-6 h-6 text-slate-300" />
                    </div>
                    <p className="text-sm font-bold text-slate-400">Không tìm thấy dữ liệu nào.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="datatable-pagination">
        <DataTablePagination table={table} totalCount={totalCount} />
      </div>
    </div>
  )
}

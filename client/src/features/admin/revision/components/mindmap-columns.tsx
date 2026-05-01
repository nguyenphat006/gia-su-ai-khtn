import { ColumnDef } from "@tanstack/react-table"
import { Checkbox } from "@/components/ui/checkbox"
import { DataTableColumnHeader } from "@/components/DataTable/DataTableColumnHeader"
import { 
  MoreHorizontal, 
  Pencil, 
  Trash2,
  Brain
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

export const mindmapColumns: ColumnDef<any>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onChange={(e: any) => table.toggleAllPageRowsSelected(!!e.target.checked)}
        aria-label="Chọn tất cả"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onChange={(e: any) => row.toggleSelected(!!e.target.checked)}
        aria-label="Chọn hàng"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "title",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Sơ đồ tư duy" />
    ),
    cell: ({ row }) => {
      return (
        <div className="flex flex-col items-center">
            <span className="font-black text-slate-800 tracking-tight text-xs uppercase leading-none mb-1">
                {row.getValue("title")}
            </span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                {row.original.topic}
            </span>
        </div>
      );
    },
  },
  {
    accessorKey: "grade",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Khối" />
    ),
    cell: ({ row }) => {
      return (
        <span className="text-xs font-black text-slate-700 bg-slate-100 px-3 py-1 rounded-lg mx-auto">
          Lớp {row.getValue("grade")}
        </span>
      );
    },
  },
  {
    accessorKey: "markdown",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Định dạng" />
    ),
    cell: ({ row }) => {
      return (
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 text-[10px] font-black uppercase tracking-wider mx-auto">
            <Brain size={10} />
            Mermaid/Markmap
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
      const doc = row.original;
      const meta = table.options.meta as any;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-slate-100 rounded-lg">
              <span className="sr-only">Mở menu</span>
              <MoreHorizontal className="h-4 w-4 text-slate-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 p-2 rounded-2xl shadow-xl border-slate-100">
            <DropdownMenuItem 
              onClick={() => meta?.onEdit?.(doc)}
              className="flex items-center gap-3 p-2.5 text-xs font-bold text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl cursor-pointer"
            >
              <Pencil size={16} className="text-slate-400" /> Chỉnh sửa
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-slate-50" />
            <DropdownMenuItem 
              className="flex items-center gap-3 p-2.5 text-xs font-bold text-red-500 hover:bg-red-50 rounded-xl cursor-pointer"
              onClick={() => meta?.onDelete?.(doc.id)}
            >
              <Trash2 size={16} className="text-red-400" /> Xóa sơ đồ
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

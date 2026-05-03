import { ColumnDef } from "@tanstack/react-table"
import { Checkbox } from "@/components/ui/checkbox"
import { DataTableColumnHeader } from "@/components/DataTable/DataTableColumnHeader"
import { MoreHorizontal, Pencil, Trash2, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export const classColumns: ColumnDef<any>[] = [
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
    accessorKey: "code",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Mã lớp" />
    ),
    cell: ({ row }) => <span className="font-black text-slate-800">{row.getValue("code")}</span>,
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Tên lớp" />
    ),
    cell: ({ row }) => <span className="font-bold text-sky-700">{row.getValue("name")}</span>,
  },
  {
    accessorKey: "grade",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Khối" />
    ),
    cell: ({ row }) => <span className="font-bold">Lớp {row.getValue("grade")}</span>,
  },
  {
    accessorKey: "academicYear",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Niên khóa" />
    ),
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
      const cls = row.original;
      const meta = table.options.meta as any;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-xl shadow-xl border-slate-100">
            <DropdownMenuLabel className="text-[10px] uppercase font-black text-slate-400">Hành động</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => meta?.onEdit?.(cls)} className="flex items-center gap-2 cursor-pointer">
              <Pencil size={14} /> Chỉnh sửa
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => meta?.onDelete?.(cls.id)} className="flex items-center gap-2 text-red-600 cursor-pointer">
              <Trash2 size={14} /> Xóa lớp
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

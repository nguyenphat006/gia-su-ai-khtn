import { ColumnDef } from "@tanstack/react-table";
import { SystemConfig } from "../types";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTableColumnHeader } from "@/components/DataTable/DataTableColumnHeader";
import { 
  MoreHorizontal, 
  Pencil, 
  Trash2, 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const columns: ColumnDef<SystemConfig>[] = [
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
    accessorKey: "key",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Khóa cấu hình" />
    ),
    cell: ({ row }) => {
      return (
        <span className="font-black text-slate-800 tracking-tight text-xs uppercase">
          {row.getValue("key")}
        </span>
      );
    },
  },
  {
    accessorKey: "value",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Giá trị" />
    ),
    cell: ({ row }) => {
      const value = row.getValue("value") as string;
      return (
        <div className="max-w-[400px] truncate text-xs font-medium text-slate-500 italic mx-auto">
          {value || "Rỗng"}
        </div>
      );
    },
  },
  {
    accessorKey: "updatedBy",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Người cập nhật" />
    ),
    cell: ({ row }) => {
      return (
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          {row.getValue("updatedBy")}
        </span>
      );
    },
  },
  {
    accessorKey: "updatedAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Ngày cập nhật" />
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue("updatedAt"));
      return (
        <div className="text-xs font-bold text-slate-500">
          {date.toLocaleDateString("vi-VN")} {date.toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
      const config = row.original;
      const meta = table.options.meta as any;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-slate-100 rounded-lg">
              <span className="sr-only">Mở menu</span>
              <MoreHorizontal className="h-4 w-4 text-slate-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 p-2 rounded-2xl shadow-xl border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <DropdownMenuLabel className="px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Hành động</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-slate-50" />
            <DropdownMenuItem 
              onClick={() => meta?.onEdit?.(config)}
              className="flex items-center gap-3 p-2.5 text-xs font-bold text-slate-600 hover:bg-sky-50 hover:text-sky-600 rounded-xl transition-colors cursor-pointer"
            >
              <Pencil size={16} className="text-slate-400" /> Chỉnh sửa
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-slate-50" />
            <DropdownMenuItem 
              className="flex items-center gap-3 p-2.5 text-xs font-bold text-red-500 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
              onClick={() => meta?.onDelete?.(config.key)}
            >
              <Trash2 size={16} className="text-red-400" /> Xóa cấu hình
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

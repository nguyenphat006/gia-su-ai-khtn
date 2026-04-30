import { ColumnDef } from "@tanstack/react-table";
import { KnowledgeDocument } from "../types";
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

export const columns: ColumnDef<KnowledgeDocument>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onChange={(e) => table.toggleAllPageRowsSelected(!!(e.target as HTMLInputElement).checked)}
        aria-label="Chọn tất cả"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onChange={(e) => row.toggleSelected(!!(e.target as HTMLInputElement).checked)}
        aria-label="Chọn hàng"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "title",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Tiêu đề tài liệu" />
    ),
    cell: ({ row }) => {
      return (
        <div className="flex flex-col gap-0.5">
          <span className="font-bold text-slate-800 truncate max-w-[300px]">
            {row.getValue("title")}
          </span>
          <span className="text-[10px] text-slate-400 font-medium">
            ID: {row.original.id.substring(0, 8)}...
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "tags",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Nhãn (Tags)" />
    ),
    cell: ({ row }) => {
      const tags = row.getValue("tags") as string[];
      return (
        <div className="flex flex-wrap gap-1">
          {tags && tags.length > 0 ? (
            tags.map((tag, i) => (
              <span 
                key={i} 
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold border border-slate-200"
              >
                {tag}
              </span>
            ))
          ) : (
            <span className="text-slate-300 text-[10px] font-medium italic">Không có nhãn</span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "isActive",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Trạng thái" />
    ),
    cell: ({ row }) => {
      const isActive = row.getValue("isActive");
      return (
        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
          isActive 
            ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
            : "bg-slate-50 text-slate-400 border-slate-100"
        }`}>
          {isActive ? "Hoạt động" : "Nháp"}
        </div>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Ngày tạo" />
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue("createdAt"));
      return (
        <div className="text-xs font-bold text-slate-500">
          {date.toLocaleDateString("vi-VN")}
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
          <DropdownMenuContent align="end" className="w-48 p-2 rounded-2xl shadow-xl border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <DropdownMenuLabel className="px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Hành động</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-slate-50" />
            <DropdownMenuItem 
              onClick={() => meta?.onEdit?.(doc)}
              className="flex items-center gap-3 p-2.5 text-xs font-bold text-slate-600 hover:bg-sky-50 hover:text-sky-600 rounded-xl transition-colors cursor-pointer"
            >
              <Pencil size={16} className="text-slate-400" /> Chỉnh sửa
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-slate-50" />
            <DropdownMenuItem 
              className="flex items-center gap-3 p-2.5 text-xs font-bold text-red-500 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
              onClick={() => meta?.onDelete?.(doc.id)}
            >
              <Trash2 size={16} className="text-red-400" /> Xóa tài liệu
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

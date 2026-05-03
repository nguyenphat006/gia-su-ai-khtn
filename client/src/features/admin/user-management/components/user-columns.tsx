import { ColumnDef } from "@tanstack/react-table"
import { Checkbox } from "@/components/ui/checkbox"
import { DataTableColumnHeader } from "@/components/DataTable/DataTableColumnHeader"
import { MoreHorizontal, Pencil, Trash2, Shield, User as UserIcon, GraduationCap } from "lucide-react"
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

export const userColumns: ColumnDef<any>[] = [
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
    accessorKey: "displayName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Họ và tên" />
    ),
    cell: ({ row }) => {
      const role = row.original.role;
      return (
        <div className="flex flex-col items-center">
            <span className="font-black text-slate-800 tracking-tight leading-none mb-1">
                {row.getValue("displayName")}
            </span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                @{row.original.username}
            </span>
        </div>
      );
    },
  },
  {
    accessorKey: "role",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Vai trò" />
    ),
    cell: ({ row }) => {
      const role = row.getValue("role") as string;
      const config: any = {
        ADMIN: { label: "Quản trị", icon: Shield, class: "bg-red-50 text-red-600 border-red-100" },
        TEACHER: { label: "Giáo viên", icon: UserIcon, class: "bg-orange-50 text-orange-600 border-orange-100" },
        STUDENT: { label: "Học sinh", icon: GraduationCap, class: "bg-sky-50 text-sky-600 border-sky-100" },
      };
      const { label, icon: Icon, class: className } = config[role] || config.STUDENT;
      return (
        <div className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-wider mx-auto", className)}>
            <Icon size={10} />
            {label}
        </div>
      );
    },
  },
  {
    accessorKey: "class",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Lớp / Khối" />
    ),
    cell: ({ row }) => {
      const cls = row.original.class;
      const grade = row.original.studentProfile?.grade || row.original.teacherProfile?.grade;
      if (!cls && !grade) return <span className="text-slate-300 italic text-[10px]">Chưa gán</span>;
      return (
        <div className="flex flex-col items-center">
            {cls && <span className="text-xs font-black text-slate-700 uppercase">{cls.name}</span>}
            {grade && <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">Khối {grade}</span>}
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Trạng thái" />
    ),
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <div className="flex items-center gap-2 justify-center">
            <div className={cn("w-1.5 h-1.5 rounded-full", status === "ACTIVE" ? "bg-emerald-500" : "bg-slate-300")} />
            <span className={cn("text-[10px] font-black uppercase tracking-widest", status === "ACTIVE" ? "text-emerald-600" : "text-slate-400")}>
                {status === "ACTIVE" ? "Hoạt động" : "Tạm khóa"}
            </span>
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
      const user = row.original;
      const meta = table.options.meta as any;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-xl shadow-xl border-slate-100">
            <DropdownMenuItem onClick={() => meta?.onEdit?.(user)} className="flex items-center gap-2 cursor-pointer">
              <Pencil size={14} /> Chỉnh sửa
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => meta?.onDelete?.(user.id)} className="flex items-center gap-2 text-red-600 cursor-pointer">
              <Trash2 size={14} /> Xóa người dùng
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

import { ColumnDef } from "@tanstack/react-table"
import { ActivityLog } from "../../analytics/types"
import { formatDistanceToNow } from "date-fns"
import { vi } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Badge } from "./Badge" // We will create this
import { UserInfo } from "./UserInfo" // We will create this

export const activityColumns: ColumnDef<ActivityLog>[] = [
  {
    accessorKey: "method",
    header: "Method",
    cell: ({ row }) => {
      const method = row.getValue("method") as string
      return (
        <Badge
          variant={
            method === "POST" ? "success" :
            method === "DELETE" ? "error" :
            method === "PUT" || method === "PATCH" ? "warning" :
            "default"
          }
        >
          {method}
        </Badge>
      )
    }
  },
  {
    accessorKey: "statusCode",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("statusCode") as number
      return (
        <Badge
          variant={
            status < 300 ? "success" :
            status < 500 ? "warning" :
            "error"
          }
        >
          {status}
        </Badge>
      )
    }
  },
  {
    accessorKey: "source",
    header: "Nguồn",
    cell: ({ row }) => {
      const source = row.getValue("source") as string
      return (
        <Badge
          variant={
            source === "student" ? "purple" :
            source === "admin" ? "blue" :
            "default"
          }
        >
          {source === "student" ? "Học sinh" : source === "admin" ? "Admin" : "Khách"}
        </Badge>
      )
    }
  },
  {
    accessorKey: "module",
    header: "Module",
    cell: ({ row }) => <span className="font-medium text-slate-600">{row.getValue("module")}</span>
  },
  {
    accessorKey: "username",
    header: "Người dùng",
    cell: ({ row }) => <UserInfo log={row.original} />
  },
  {
    accessorKey: "action",
    header: "Hành động",
    cell: ({ row }) => <span className="text-sm text-slate-700">{row.getValue("action")}</span>
  },
  {
    accessorKey: "durationMs",
    header: "Thời gian",
    cell: ({ row }) => {
      const duration = row.getValue("durationMs") as number
      return (
        <span className={cn(
          "text-xs font-mono",
          duration > 2000 ? "text-red-500 font-bold" : "text-slate-500"
        )}>
          {duration}ms
        </span>
      )
    }
  },
  {
    accessorKey: "createdAt",
    header: "Thời gian",
    cell: ({ row }) => {
      const date = new Date(row.getValue("createdAt"))
      return (
        <span className="text-xs text-slate-400" title={date.toLocaleString()}>
          {formatDistanceToNow(date, { addSuffix: true, locale: vi })}
        </span>
      )
    }
  }
]

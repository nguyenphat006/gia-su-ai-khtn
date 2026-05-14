import * as React from "react"
import { motion } from "motion/react"
import { 
  Activity, 
  Search, 
  RefreshCcw, 
  AlertCircle, 
  Clock, 
  Layers,
  Users,
  Filter,
  ChevronRight,
  Download
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTable } from "@/components/DataTable/DataTable"
import { activityColumns } from "./components/activity-columns"
import { adminAnalyticsService } from "../analytics/services/analytics.service"
import { ActivityLog, ActivityLogSummary } from "../analytics/types"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { type PaginationState } from "@tanstack/react-table"

export default function ActivityLogIndex() {
  const [data, setData] = React.useState<ActivityLog[]>([])
  const [summary, setSummary] = React.useState<ActivityLogSummary | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [isExporting, setIsExporting] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const [sourceFilter, setSourceFilter] = React.useState<string>("all")
  const [moduleFilter, setModuleFilter] = React.useState<string>("all")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")

  const [{ pageIndex, pageSize }, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 50,
  })
  const [totalCount, setTotalCount] = React.useState(0)
  const [pageCount, setPageCount] = React.useState(0)

  const fetchData = React.useCallback(async () => {
    setLoading(true)
    try {
      const [logsRes, summaryRes] = await Promise.all([
        adminAnalyticsService.getActivityLogs({
          page: pageIndex + 1,
          limit: pageSize,
          search: search || undefined,
          source: sourceFilter === "all" ? undefined : sourceFilter,
          module: moduleFilter === "all" ? undefined : moduleFilter,
          statusGroup: statusFilter === "all" ? undefined : statusFilter,
        }),
        adminAnalyticsService.getActivityLogSummary()
      ])

      setData(logsRes.data.data)
      setTotalCount(logsRes.data.pagination.total)
      setPageCount(logsRes.data.pagination.totalPages)
      setSummary(summaryRes.data)
    } catch (err: any) {
      toast.error(err.message || "Không thể tải dữ liệu nhật ký")
    } finally {
      setLoading(false)
    }
  }, [pageIndex, pageSize, search, sourceFilter, moduleFilter, statusFilter])

  React.useEffect(() => {
    const timer = setTimeout(() => fetchData(), 300)
    return () => clearTimeout(timer)
  }, [fetchData])

  const handleExportExcel = async () => {
    setIsExporting(true)
    const toastId = toast.loading("Đang chuẩn bị file Excel...")
    
    try {
      const params = new URLSearchParams({
        search: search || "",
        source: sourceFilter === "all" ? "" : sourceFilter,
        module: moduleFilter === "all" ? "" : moduleFilter,
        statusGroup: statusFilter === "all" ? "" : statusFilter,
      }).toString()

      // Lấy token từ localStorage hoặc cookies (apiClient thường tự xử lý, nhưng fetch cần manual)
      const token = localStorage.getItem("auth-token") // Giả định vị trí token
      
      const response = await fetch(`/api/reports/activity-export?${params}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })
      
      if (!response.ok) throw new Error("Lỗi khi tải file")

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `bao_cao_hoat_dong_${new Date().toISOString().slice(0, 10)}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)

      toast.success("Đã xuất báo cáo Excel thành công!", { id: toastId })
    } catch (error) {
      console.error("Export error:", error)
      toast.error("Lỗi khi xuất báo cáo.", { id: toastId })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-xl shadow-indigo-200">
            <Activity size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 uppercase tracking-tight">Activity Logs</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nhật ký hành vi & hiệu năng hệ thống</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleExportExcel}
            disabled={isExporting || loading}
            className="rounded-xl border-slate-200 h-10 px-4 gap-2 text-xs font-bold hover:bg-slate-50 transition-all shadow-sm"
          >
            <Download size={14} className={isExporting ? "animate-bounce" : ""} />
            Xuất Excel
          </Button>
          
          <Button 
            variant="outline" 
            onClick={fetchData} 
            disabled={loading}
            className="rounded-xl border-slate-200 h-10 gap-2 text-xs font-bold"
          >
            <RefreshCcw size={14} className={loading ? "animate-spin" : ""} />
            Tải lại
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            title="Tổng request (Hôm nay)" 
            value={summary.stats.totalToday} 
            icon={<Activity size={20} />} 
            color="indigo" 
          />
          <StatCard 
            title="Lỗi 4xx" 
            value={summary.stats.error4xxToday} 
            icon={<AlertCircle size={20} />} 
            color="amber" 
          />
          <StatCard 
            title="Lỗi 5xx" 
            value={summary.stats.error5xxToday} 
            icon={<AlertCircle size={20} />} 
            color="red" 
          />
          <StatCard 
            title="Request chậm (>2s)" 
            value={summary.stats.slowRequestsToday} 
            icon={<Clock size={20} />} 
            color="orange" 
          />
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-[1.5rem] border border-slate-100 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Tìm theo hành động, username hoặc path..."
              className="pl-10 h-11 bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all rounded-xl"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <select 
              className="h-11 px-4 bg-slate-50 border-transparent rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
            >
              <option value="all">Tất cả nguồn</option>
              <option value="student">Học sinh</option>
              <option value="admin">Admin / GV</option>
              <option value="guest">Khách</option>
            </select>

            <select 
              className="h-11 px-4 bg-slate-50 border-transparent rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="2xx">Thành công (2xx)</option>
              <option value="4xx">Lỗi Client (4xx)</option>
              <option value="5xx">Lỗi Server (5xx)</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-2 flex items-center gap-1">
            <Filter size={10} /> Module:
          </span>
          {["all", "auth", "chat", "arena", "revision", "users", "classes", "system", "documents"].map(mod => (
            <button
              key={mod}
              onClick={() => setModuleFilter(mod)}
              className={cn(
                "px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                moduleFilter === mod 
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" 
                  : "bg-slate-50 text-slate-400 hover:bg-slate-100"
              )}
            >
              {mod === "all" ? "Tất cả" : mod}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden">
        <DataTable
          columns={activityColumns}
          data={data}
          loading={loading}
          pagination={{
            pageIndex,
            pageSize,
            pageCount,
            totalCount
          }}
          onPaginationChange={setPagination}
        />
      </div>
    </div>
  )
}

function StatCard({ title, value, icon, color }: { title: string, value: number, icon: React.ReactNode, color: string }) {
  const colors: Record<string, string> = {
    indigo: "bg-indigo-50 text-indigo-600 shadow-indigo-100",
    amber: "bg-amber-50 text-amber-600 shadow-amber-100",
    red: "bg-red-50 text-red-600 shadow-red-100",
    orange: "bg-orange-50 text-orange-600 shadow-orange-100",
  }

  return (
    <div className="bg-white p-4 rounded-3xl border border-slate-50 shadow-sm flex items-center gap-4">
      <div className={cn("p-3 rounded-2xl shadow-lg", colors[color])}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{title}</p>
        <p className="text-2xl font-black text-slate-800">{value.toLocaleString()}</p>
      </div>
    </div>
  )
}

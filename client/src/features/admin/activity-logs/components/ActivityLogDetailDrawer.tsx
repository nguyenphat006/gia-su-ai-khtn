import * as React from "react"
import { 
  Activity, 
  User, 
  Globe, 
  Clock, 
  ShieldCheck, 
  AlertCircle,
  Hash,
  Terminal,
  MousePointer2,
  Cpu,
  Calendar,
  Layers,
  Code
} from "lucide-react"
import { ResponsiveModal } from "@/components/ui/ResponsiveModal"
import { adminAnalyticsService } from "../../analytics/services/analytics.service"
import { ActivityLog } from "../../analytics/types"
import { formatDistanceToNow } from "date-fns"
import { vi } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Badge } from "./Badge"
import Spinner from "@/components/ui/Spinner"

interface ActivityLogDetailDrawerProps {
  logId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ActivityLogDetailDrawer({
  logId,
  open,
  onOpenChange
}: ActivityLogDetailDrawerProps) {
  const [log, setLog] = React.useState<ActivityLog | null>(null)
  const [loading, setLoading] = React.useState(false)

  const fetchDetail = React.useCallback(async () => {
    if (!logId) return
    setLoading(true)
    try {
      const res = await adminAnalyticsService.getActivityLogDetail(logId)
      setLog(res.data)
    } catch (error) {
      console.error("Lỗi khi tải chi tiết log:", error)
    } finally {
      setLoading(false)
    }
  }, [logId])

  React.useEffect(() => {
    if (open && logId) {
      fetchDetail()
    } else if (!open) {
      setLog(null)
    }
  }, [open, logId, fetchDetail])

  return (
    <ResponsiveModal
      isOpen={open}
      onOpenChange={onOpenChange}
      maxWidth="3xl"
      title="Chi tiết Nhật ký hoạt động"
      description="Thông tin chi tiết về hành vi của người dùng và hệ thống"
    >
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Spinner className="w-8 h-8 text-indigo-600" />
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest animate-pulse">Đang tải dữ liệu...</p>
        </div>
      ) : log ? (
        <div className="space-y-8 pb-10">
          {/* Header Info */}
          <div className="flex flex-wrap gap-4 items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-3 rounded-xl shadow-lg",
                log.statusCode < 300 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
              )}>
                <Activity size={24} />
              </div>
              <div>
                <p className="text-sm font-black text-slate-800 uppercase tracking-tight">{log.action}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant={log.method === 'POST' ? 'success' : log.method === 'DELETE' ? 'error' : 'default'}>
                    {log.method}
                  </Badge>
                  <span className="text-xs font-mono text-slate-500">{log.path}</span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center justify-end gap-1">
                <Calendar size={12} />
                {new Date(log.createdAt).toLocaleString("vi-VN")}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true, locale: vi })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* User Info */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <User size={12} /> Đối tượng thực hiện
              </h4>
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3">
                <InfoRow label="Người dùng" value={log.username || "Khách (Ẩn danh)"} icon={<User size={14} />} />
                <InfoRow label="Vai trò" value={log.userRole || "N/A"} icon={<ShieldCheck size={14} />} />
                <InfoRow 
                  label="Nguồn" 
                  value={log.source === 'student' ? 'Học sinh' : log.source === 'admin' ? 'Admin / GV' : 'Khách'} 
                  icon={<Globe size={14} />} 
                />
              </div>
            </div>

            {/* Performance Info */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <Cpu size={12} /> Hiệu năng & Mạng
              </h4>
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3">
                <InfoRow 
                  label="Thời gian xử lý" 
                  value={`${log.durationMs}ms`} 
                  color={log.durationMs > 2000 ? "text-red-500" : "text-emerald-500"}
                  icon={<Clock size={14} />} 
                />
                <InfoRow label="Mã trạng thái" value={log.statusCode.toString()} icon={<Hash size={14} />} />
                <InfoRow label="Địa chỉ IP" value={log.ipAddress || "Không rõ"} icon={<Globe size={14} />} />
              </div>
            </div>
          </div>

          {/* User Agent */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <Terminal size={12} /> Thông tin thiết bị (User Agent)
            </h4>
            <div className="bg-slate-900 text-slate-300 p-4 rounded-2xl font-mono text-xs break-all leading-relaxed opacity-90">
              {log.userAgent || "N/A"}
            </div>
          </div>

          {/* Module & Action */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <Layers size={12} /> Phân loại Module
            </h4>
            <div className="flex gap-2">
              <Badge variant="blue" className="px-4 py-1.5 uppercase text-[10px] tracking-widest">{log.module}</Badge>
              <Badge variant="outline" className="px-4 py-1.5 uppercase text-[10px] tracking-widest">{log.action}</Badge>
            </div>
          </div>

          {/* PAYLOAD DETAILS - Dữ liệu quan trọng nhất theo yêu cầu */}
          <div className="space-y-6 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.2em] flex items-center gap-2">
                <Code size={14} /> Dữ liệu chi tiết hành vi (Payload)
              </h4>
            </div>

            {/* Query Params */}
            {log.queryParams && Object.keys(log.queryParams as object).length > 0 && (
              <div className="space-y-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase ml-1">Tham số Query (URL Parameters)</p>
                <JsonViewer data={log.queryParams} />
              </div>
            )}

            {/* Request Body */}
            <div className="space-y-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase ml-1">Dữ liệu gửi lên (Request Body)</p>
              {log.requestBody && Object.keys(log.requestBody as object).length > 0 ? (
                <JsonViewer data={log.requestBody} />
              ) : (
                <div className="p-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Không có dữ liệu gửi kèm</p>
                </div>
              )}
            </div>
          </div>

          {/* Error Message if any */}
          {log.errorMessage && (
            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-red-500 uppercase tracking-[0.2em] flex items-center gap-2">
                <AlertCircle size={12} /> Thông báo lỗi
              </h4>
              <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-xs font-bold border border-red-100">
                {log.errorMessage}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-slate-400 font-bold uppercase tracking-widest">Không tìm thấy thông tin</p>
        </div>
      )}
    </ResponsiveModal>
  )
}

function InfoRow({ label, value, icon, color }: { label: string, value: string, icon: React.ReactNode, color?: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1 border-b border-slate-50 last:border-0">
      <div className="flex items-center gap-2 text-slate-400">
        <span className="opacity-50">{icon}</span>
        <span className="text-[10px] font-bold uppercase tracking-widest">{label}:</span>
      </div>
      <span className={cn("text-xs font-bold text-slate-700 text-right truncate", color)}>
        {value}
      </span>
    </div>
  )
}

function JsonViewer({ data }: { data: any }) {
  return (
    <div className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-xl group relative">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800/50 border-b border-slate-800">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
        </div>
        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em]">JSON Viewer</span>
      </div>
      <pre className="p-5 text-[13px] font-mono text-indigo-300 overflow-x-auto custom-scrollbar-horizontal leading-relaxed whitespace-pre-wrap">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  )
}

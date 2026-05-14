import { ActivityLog } from "../../analytics/types"
import { User } from "lucide-react"

export function UserInfo({ log }: { log: ActivityLog }) {
  if (!log.userId) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
          <User size={14} />
        </div>
        <span className="text-sm text-slate-400 italic">Khách</span>
      </div>
    )
  }

  const avatarUrl = log.user?.studentProfile?.avatarUrl || log.user?.teacherProfile?.avatarUrl

  return (
    <div className="flex items-center gap-2">
      {avatarUrl ? (
        <img src={avatarUrl} alt={log.username || ""} className="w-8 h-8 rounded-full object-cover border border-slate-100" />
      ) : (
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
          {log.username?.slice(0, 2).toUpperCase()}
        </div>
      )}
      <div className="flex flex-col">
        <span className="text-sm font-semibold text-slate-700">{log.user?.displayName || log.username}</span>
        <span className="text-[10px] text-slate-400 uppercase tracking-tighter">{log.userRole}</span>
      </div>
    </div>
  )
}

import { motion } from "motion/react"
import { User as UserIcon, Zap, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ResponsiveModal } from "@/components/ui/ResponsiveModal"
import FormattedContent from "@/components/ui/FormattedContent"
import { ChatLog } from "../types"

interface ChatLogDetailModalProps {
  selectedLog: ChatLog | null
  onClose: () => void
  isLoadingSession: boolean
  sessionMessages: any[]
}

export function ChatLogDetailModal({ selectedLog, onClose, isLoadingSession, sessionMessages }: ChatLogDetailModalProps) {
  if (!selectedLog) return null;

  return (
    <ResponsiveModal
      isOpen={!!selectedLog}
      onOpenChange={(open) => !open && onClose()}
      title="Chi tiết hội thoại"
      maxWidth="3xl"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-sky-600 font-bold uppercase">
               {selectedLog.session?.user?.displayName?.[0] || "?"}
             </div>
             <div>
               <p className="text-sm font-bold text-slate-900">{selectedLog.session?.user?.displayName || "Ẩn danh"}</p>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                 @{selectedLog.session?.user?.username || "unknown"}
               </p>
             </div>
           </div>
           <div className="text-right">
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Thời gian</p>
             <p className="text-xs font-bold text-slate-600">
               {selectedLog.createdAt ? new Date(selectedLog.createdAt).toLocaleString() : "---"}
             </p>
           </div>
        </div>

        <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar px-1">
           {isLoadingSession ? (
             <div className="flex flex-col items-center justify-center py-20 gap-4">
               <div className="w-12 h-12 border-4 border-sky-100 border-t-sky-500 rounded-full animate-spin" />
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Đang trích xuất toàn bộ hội thoại...</p>
             </div>
           ) : sessionMessages.length > 0 ? (
             <div className="space-y-4">
               {sessionMessages.map((msg, idx) => (
                 <div key={idx} className={cn(
                   "flex flex-col gap-2 max-w-[90%]",
                   msg.role === "USER" ? "ml-auto items-end" : "mr-auto items-start"
                 )}>
                    <div className={cn(
                      "flex items-center gap-2 text-[8px] font-bold uppercase tracking-widest px-1",
                      msg.role === "USER" ? "text-slate-400" : "text-sky-500"
                    )}>
                      {msg.role === "USER" ? <UserIcon size={10} /> : <Zap size={10} className="text-orange-400" />}
                      {msg.role === "USER" ? "Học sinh" : "Trợ lý AI"}
                    </div>
                    <div className={cn(
                      "p-4 rounded-2xl text-sm leading-relaxed",
                      msg.role === "USER" 
                        ? "bg-sky-50 text-sky-900 rounded-tr-none border border-sky-100 font-bold italic shadow-sm" 
                        : "bg-white text-slate-700 rounded-tl-none border border-slate-100 shadow-md"
                    )}>
                      <FormattedContent content={msg.content} />
                    </div>
                 </div>
               ))}
             </div>
           ) : (
             <div className="space-y-6">
               <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                    <UserIcon size={12} /> Học sinh hỏi
                  </div>
                  <div className="bg-sky-50 p-5 rounded-2xl rounded-tl-none border border-sky-100 text-sky-900 text-sm font-bold italic leading-relaxed shadow-sm">
                    "{selectedLog.question}"
                  </div>
               </div>

               <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                    <Zap size={12} className="text-orange-400" /> Trợ lý AI trả lời
                  </div>
                  <div className="bg-white p-6 rounded-2xl rounded-tr-none border border-slate-100 shadow-sm text-slate-700 text-sm leading-relaxed prose prose-slate max-w-none">
                    <FormattedContent content={selectedLog.answer || "AI chưa có phản hồi cho câu hỏi này."} />
                  </div>
               </div>
             </div>
           )}
        </div>
        
        <div className="flex justify-end pt-4 border-t border-slate-100">
           <Button onClick={onClose} className="rounded-xl px-10 h-11 font-bold uppercase tracking-[0.2em] text-[10px] bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-xl active:scale-95">Đóng cửa sổ</Button>
        </div>
      </div>
    </ResponsiveModal>
  )
}

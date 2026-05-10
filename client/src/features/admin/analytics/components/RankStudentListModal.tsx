import { Button } from "@/components/ui/button"
import { ResponsiveModal } from "@/components/ui/ResponsiveModal"

interface RankStudentListModalProps {
  selectedRank: { rank: string, count: number, students: any[] } | null
  onClose: () => void
}

export function RankStudentListModal({ selectedRank, onClose }: RankStudentListModalProps) {
  if (!selectedRank) return null;

  return (
    <ResponsiveModal
      isOpen={!!selectedRank}
      onOpenChange={(open) => !open && onClose()}
      title={`Học sinh bậc ${selectedRank.rank}`}
      maxWidth="2xl"
    >
      <div className="space-y-6">
        <div className="bg-sky-50 p-4 rounded-2xl border border-sky-100 flex items-center justify-between">
           <div>
              <p className="text-[10px] font-bold text-sky-600 uppercase tracking-widest">Phân loại danh hiệu</p>
              <h4 className="text-sm font-bold text-sky-900 uppercase tracking-tight">{selectedRank.rank}</h4>
           </div>
           <div className="text-right">
              <p className="text-2xl font-bold text-sky-600 leading-none">{selectedRank.count}</p>
              <p className="text-[8px] font-bold text-sky-400 uppercase tracking-widest mt-1">Học sinh</p>
           </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar p-1">
           {selectedRank.students?.map((s: any) => (
             <div key={s.id} className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow-md transition-all">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 text-xs font-bold border border-slate-100">
                   {s.displayName?.[0] || "?"}
                </div>
                <div className="min-w-0">
                   <p className="text-xs font-bold text-slate-800 truncate uppercase tracking-tight">{s.displayName}</p>
                   <p className="text-[9px] text-slate-400 font-bold leading-none mt-1">{(s.totalXp || 0).toLocaleString()} EXP</p>
                </div>
             </div>
           ))}
           {(!selectedRank.students || selectedRank.students.length === 0) && (
             <div className="col-span-full py-10 text-center text-slate-400 italic text-xs font-bold">Chưa có học sinh nào đạt danh hiệu này.</div>
           )}
        </div>
        
        <div className="flex justify-end pt-4 border-t border-slate-100">
           <Button onClick={onClose} className="rounded-xl px-10 h-11 font-bold uppercase tracking-[0.2em] text-[10px] bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-xl active:scale-95">Đóng</Button>
        </div>
      </div>
    </ResponsiveModal>
  )
}

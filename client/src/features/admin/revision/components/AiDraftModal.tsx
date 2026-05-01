import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import { 
  Sparkles, 
  RefreshCcw, 
  Save, 
  ArrowRight, 
  ArrowLeft,
  X,
  Zap,
  Layers,
  Brain,
  CheckCircle2,
  AlertCircle
} from "lucide-react"
import { ResponsiveModal } from "@/components/ui/ResponsiveModal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { adminRevisionService } from "../services/revision.service"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface AiDraftModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

type Step = "request" | "review"

export default function AiDraftModal({ isOpen, onClose, onSuccess }: AiDraftModalProps) {
  const [step, setStep] = React.useState<Step>("request")
  const [loading, setLoading] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  
  // Request Params
  const [type, setType] = React.useState<"QUIZ" | "FLASHCARD" | "MINDMAP">("QUIZ")
  const [grade, setGrade] = React.useState("6")
  const [topic, setTopic] = React.useState("")
  const [count, setCount] = React.useState(5)

  // Draft Data
  const [draftData, setDraftData] = React.useState<any>(null)

  const handleGenerate = async () => {
    if (!topic.trim()) return
    setLoading(true)
    try {
      const response = await adminRevisionService.generateDraft({
        type,
        grade: Number(grade),
        topic,
        count
      })
      setDraftData(response.data)
      setStep("review")
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi gọi AI")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (type === "QUIZ") {
        // AI returns { quizzes: [...] }
        const quizzes = draftData.quizzes || []
        await Promise.all(quizzes.map((q: any) => 
          adminRevisionService.createQuestion({
            grade: Number(grade),
            topic,
            type: q.isEssay ? "ESSAY" : "MULTIPLE_CHOICE",
            difficulty: q.difficulty || "Trung bình",
            content: q.question,
            options: q.options || null,
            correctAnswer: q.options ? q.options[q.answerIndex] : q.answer,
            explanation: q.explanation,
            isActive: true
          })
        ))
      } else if (type === "FLASHCARD") {
        // AI returns { flashcards: [...] }
        await adminRevisionService.createFlashcard({
          grade: Number(grade),
          topic,
          title: `Bộ thẻ: ${topic}`,
          cards: draftData.flashcards,
          isActive: true
        })
      } else if (type === "MINDMAP") {
        // AI returns { mindmap: [...] }
        await adminRevisionService.createMindmap({
          grade: Number(grade),
          topic,
          title: `Sơ đồ: ${topic}`,
          markdown: JSON.stringify(draftData.mindmap), // Currently storing as JSON string or raw
          isActive: true
        })
      }

      toast.success("Đã lưu nội dung vào Ngân hàng thành công!")
      onSuccess()
      onClose()
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi lưu dữ liệu")
    } finally {
      setSaving(false)
    }
  }

  const reset = () => {
    setStep("request")
    setDraftData(null)
  }

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onOpenChange={onClose}
      maxWidth={step === "review" ? "4xl" : "md"}
      footer={
        <div className="flex justify-between w-full">
          <Button variant="ghost" onClick={step === "review" ? reset : onClose} className="rounded-xl font-bold">
            {step === "review" ? <><ArrowLeft className="mr-2 h-4 w-4" /> Làm lại</> : "Hủy bỏ"}
          </Button>
          
          {step === "request" ? (
            <Button 
              onClick={handleGenerate} 
              disabled={loading || !topic.trim()}
              className="bg-slate-900 text-white hover:bg-slate-800 rounded-xl font-black px-8 h-12 shadow-lg transition-all gap-2"
            >
              {loading ? <RefreshCcw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Bắt đầu soạn thảo
            </Button>
          ) : (
            <Button 
              onClick={handleSave}
              disabled={saving}
              className="bg-sky-600 text-white hover:bg-sky-700 rounded-xl font-black px-10 h-12 shadow-lg shadow-sky-100 transition-all gap-2"
            >
              {saving ? <RefreshCcw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Lưu vào Ngân hàng
            </Button>
          )}
        </div>
      }
    >
      <div className="py-2">
        {step === "request" ? (
          <div className="space-y-6">
            <div className="text-center space-y-2 mb-8">
              <div className="w-16 h-16 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center mx-auto border border-sky-100 shadow-sm animate-pulse">
                <Sparkles size={32} />
              </div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">AI Soạn thảo nội dung</h3>
              <p className="text-sm text-slate-500 font-medium">Nhập chủ đề để AI tự động soạn câu hỏi & tài liệu ôn tập.</p>
            </div>

            <div className="space-y-4">
               {/* Type Selector */}
               <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: "QUIZ", label: "Quiz", icon: Zap },
                    { id: "FLASHCARD", label: "Thẻ", icon: Layers },
                    { id: "MINDMAP", label: "Sơ đồ", icon: Brain }
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setType(t.id as any)}
                      className={cn(
                        "flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all gap-2",
                        type === t.id ? "border-sky-500 bg-sky-50 text-sky-700 ring-4 ring-sky-50" : "border-slate-100 text-slate-400 hover:border-slate-200"
                      )}
                    >
                      <t.icon size={20} />
                      <span className="text-[10px] font-black uppercase tracking-widest">{t.label}</span>
                    </button>
                  ))}
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Khối lớp</Label>
                    <select 
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                      className="w-full h-12 bg-slate-50 border-2 border-slate-100 rounded-xl px-4 font-bold text-slate-700 outline-none focus:border-sky-500 transition-all"
                    >
                      <option value="6">Lớp 6</option>
                      <option value="7">Lớp 7</option>
                      <option value="8">Lớp 8</option>
                      <option value="9">Lớp 9</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Số lượng (Dự kiến)</Label>
                    <Input 
                      type="number" 
                      value={count} 
                      onChange={(e) => setCount(Number(e.target.value))}
                      className="h-12 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold"
                    />
                  </div>
               </div>

               <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Chủ đề bài học</Label>
                  <Input 
                    placeholder="VD: Các thành phần của tế bào, Lực ma sát..."
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="h-14 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-lg"
                  />
               </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
               <div>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Kiểm duyệt nội dung nháp</h3>
                  <p className="text-xs text-slate-500 font-medium italic">Nội dung được sinh dựa trên bộ sách "Chân trời sáng tạo".</p>
               </div>
               <div className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-full border border-emerald-100 flex items-center gap-2">
                  <CheckCircle2 size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest text-center">AI đã hoàn tất</span>
               </div>
            </div>

            <div className="max-h-[50vh] overflow-y-auto custom-scrollbar pr-2 space-y-4">
               {type === "QUIZ" && draftData?.quizzes?.map((q: any, i: number) => (
                 <div key={i} className="p-6 bg-slate-50 rounded-3xl border border-slate-200 relative group">
                    <div className="absolute -left-3 top-6 w-8 h-8 bg-white border-2 border-slate-200 rounded-full flex items-center justify-center font-black text-xs text-slate-400 shadow-sm">
                        {i + 1}
                    </div>
                    <p className="font-bold text-slate-800 mb-4 ml-2">{q.question}</p>
                    <div className="grid grid-cols-2 gap-3 ml-2">
                        {q.options?.map((opt: string, oi: number) => (
                          <div key={oi} className={cn(
                            "p-3 rounded-xl border text-xs font-medium",
                            oi === q.answerIndex ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-white border-slate-200 text-slate-500"
                          )}>
                             {String.fromCharCode(65 + oi)}. {opt}
                          </div>
                        ))}
                    </div>
                    <div className="mt-4 p-3 bg-white/50 rounded-xl border border-slate-100 text-[10px] text-slate-500 italic ml-2">
                        <span className="font-black uppercase tracking-widest text-sky-600 mr-2">Giải thích:</span>
                        {q.explanation}
                    </div>
                 </div>
               ))}

               {type === "FLASHCARD" && draftData?.flashcards?.map((f: any, i: number) => (
                 <div key={i} className="grid grid-cols-2 gap-4 p-4 bg-orange-50/30 rounded-2xl border border-orange-100">
                    <div className="space-y-1">
                        <span className="text-[9px] font-black text-orange-400 uppercase tracking-widest">Mặt trước</span>
                        <p className="text-xs font-bold text-slate-700">{f.front}</p>
                    </div>
                    <div className="space-y-1">
                        <span className="text-[9px] font-black text-orange-400 uppercase tracking-widest">Mặt sau</span>
                        <p className="text-xs font-bold text-orange-700">{f.back}</p>
                    </div>
                 </div>
               ))}

               {type === "MINDMAP" && (
                 <div className="p-6 bg-indigo-50/30 rounded-3xl border border-indigo-100">
                    <div className="flex items-center gap-3 mb-4">
                        <Brain className="text-indigo-600" />
                        <span className="text-sm font-black text-indigo-900 uppercase">Cấu trúc sơ đồ tư duy</span>
                    </div>
                    <pre className="text-[10px] font-mono text-slate-600 bg-white p-4 rounded-xl overflow-x-auto">
                        {JSON.stringify(draftData.mindmap, null, 2)}
                    </pre>
                 </div>
               )}
            </div>

            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-3">
                <AlertCircle className="text-amber-600 shrink-0" size={18} />
                <p className="text-[11px] text-amber-900 font-bold leading-relaxed">
                   Thầy/Cô vui lòng kiểm tra lại nội dung trước khi lưu. Các câu hỏi này sẽ được đưa trực tiếp vào Ngân hàng để Học sinh ôn tập.
                </p>
            </div>
          </div>
        )}
      </div>
    </ResponsiveModal>
  )
}

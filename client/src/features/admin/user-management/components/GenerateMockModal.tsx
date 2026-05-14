import * as React from "react"
import { motion } from "motion/react"
import { Bot, X, RefreshCcw, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { adminUserService } from "../services/user.service"
import { SeedOptionsForm } from "./SeedOptionsForm"

interface GenerateMockModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function GenerateMockModal({ isOpen, onClose, onSuccess }: GenerateMockModalProps) {
  const [count, setCount] = React.useState(10)
  const [grade, setGrade] = React.useState("")
  const [seedActivity, setSeedActivity] = React.useState(true)
  const [seedOptions, setSeedOptions] = React.useState({
    xpMarch: 250,
    xpApril: 500,
    xpMay: 550,
    maxStreak: 4,
    timeDistribution: "evening",
    customQuestion: "Treo một quả cân 100g vào một lực kế thì kim của lực kế chỉ vạch thứ 2. Nếu treo thêm quả cân 50g vào lực kế thì kim của lực kế chỉ vạch thứ bao nhiêu?",
    customQuestionCount: 7
  });

  const [loading, setLoading] = React.useState(false)
  const [preview, setPreview] = React.useState<any[]>([])
  const [step, setStep] = React.useState<"config" | "preview">("config")

  const handleGenerate = async () => {
    setLoading(true)
    try {
      const res = await adminUserService.generateMockUsers({
        count,
        grade: grade ? Number(grade) : undefined,
        saveToDb: false, // Luôn preview trước
      })
      setPreview(res.data.users)
      setStep("preview")
    } catch (err: any) {
      toast.error(err.message || "AI không tạo được dữ liệu")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (preview.length === 0) return
    setLoading(true)
    try {
      const res = await adminUserService.importFromJson(preview, seedActivity, seedOptions)
      const saved = res.data
      toast.success(`Đã tạo thành công ${saved.success} học sinh! ${saved.errors.length > 0 ? `(${saved.errors.length} lỗi)` : ""}`)
      onSuccess()
      handleClose()
    } catch (err: any) {
      toast.error(err.message || "Lỗi lưu dữ liệu")
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setStep("config")
    setPreview([])
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        <div className="bg-gradient-to-r from-indigo-600 to-sky-600 px-6 py-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bot size={22} />
              <h3 className="font-bold">Sinh học sinh ảo bằng AI</h3>
            </div>
            <button onClick={handleClose} className="p-1 hover:bg-white/20 rounded-full transition-colors"><X size={18} /></button>
          </div>
        </div>

        {step === "config" ? (
          <div className="p-6 space-y-5">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Số lượng học sinh</label>
              <div className="flex items-center gap-4">
                <input
                  type="range" min="1" max="50"
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                  className="flex-1 accent-indigo-600"
                />
                <span className="w-10 text-center font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100">{count}</span>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Khối lớp (Tùy chọn)</label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Ngẫu nhiên (lớp 6–9)</option>
                <option value="6">Lớp 6</option>
                <option value="7">Lớp 7</option>
                <option value="8">Lớp 8</option>
                <option value="9">Lớp 9</option>
              </select>
            </div>

            <div className="flex items-center gap-2 cursor-pointer p-3 bg-indigo-50/50 rounded-xl border border-indigo-100">
               <input 
                 type="checkbox" 
                 checked={seedActivity} 
                 onChange={(e) => setSeedActivity(e.target.checked)}
                 className="w-4 h-4 accent-indigo-600"
               />
               <span className="text-[10px] font-bold text-indigo-900 uppercase leading-none">Tự động sinh dữ liệu hoạt động giả</span>
            </div>

            {seedActivity && (
              <SeedOptionsForm options={seedOptions} setOptions={setSeedOptions} />
            )}

            <div className="bg-indigo-50 rounded-2xl p-4 text-xs text-indigo-700">
              <p className="font-bold mb-1 uppercase tracking-wider text-[10px]">✨ AI sẽ tạo tự động:</p>
              <ul className="space-y-1 font-bold opacity-80 uppercase text-[8px] tracking-tight">
                <li>• Tên học sinh Việt Nam thực tế</li>
                <li>• Tên đăng nhập không dấu viết liền</li>
                <li>• Mật khẩu mặc định: 123456</li>
              </ul>
            </div>

            <Button 
              onClick={handleGenerate} 
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-12 font-bold shadow-lg shadow-indigo-200"
            >
              {loading ? <RefreshCcw className="animate-spin mr-2" size={18} /> : null}
              Bắt đầu tạo dữ liệu AI
            </Button>
          </div>
        ) : (
          <div className="p-6 space-y-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-slate-700 uppercase tracking-tight">Xem trước {preview.length} học sinh</p>
              <button onClick={() => setStep("config")} className="text-[10px] font-bold text-indigo-600 hover:underline uppercase tracking-widest">← Thay đổi</button>
            </div>

            <div className="max-h-[300px] overflow-y-auto border border-slate-100 rounded-2xl bg-slate-50 p-2 space-y-1 custom-scrollbar">
              {preview.map((u, i) => (
                <div key={i} className="bg-white p-2.5 rounded-xl border border-slate-100 flex items-center justify-between shadow-sm">
                  <div>
                    <p className="text-xs font-bold text-slate-800">{u.displayName}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">@{u.username} • Lớp {u.grade}</p>
                  </div>
                  <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                    <CheckCircle2 size={14} />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={handleClose} className="flex-1 rounded-xl h-12 font-bold border-slate-200">Hủy bỏ</Button>
              <Button 
                onClick={handleSave} 
                disabled={loading}
                className="flex-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-12 px-8 font-bold"
              >
                {loading ? <RefreshCcw className="animate-spin mr-2" size={18} /> : null}
                Lưu vào Hệ thống
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}

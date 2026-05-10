import * as React from "react"
import { motion } from "motion/react"
import { Upload, X, Download, RefreshCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { adminUserService } from "../services/user.service"
import { SeedOptionsForm } from "./SeedOptionsForm"

interface ImportExcelModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (result: any) => void
}

export function ImportExcelModal({ isOpen, onClose, onSuccess }: ImportExcelModalProps) {
  const [loading, setLoading] = React.useState(false)
  const [grade, setGrade] = React.useState("6")
  const [seedActivity, setSeedActivity] = React.useState(true)
  const [seedOptions, setSeedOptions] = React.useState({
    xpMarch: 250,
    xpApril: 500,
    xpMay: 550,
    maxStreak: 4
  });
  
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleDownloadTemplate = async () => {
    try {
      await adminUserService.exportToExcel({ template: true })
      toast.success("Đã tải file mẫu!")
    } catch (err) {
      toast.error("Không thể tải file mẫu")
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setLoading(true)
    try {
      const res = await adminUserService.importFromExcel(file, { grade, seedActivity, seedOptions })
      onSuccess(res.data)
      onClose()
    } catch (err: any) {
      toast.error(err.message || "Lỗi import file")
    } finally {
      setLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Upload size={20} />
            <h3 className="font-bold">Nhập dữ liệu từ Excel</h3>
          </div>
          <button onClick={onClose}><X size={18} /></button>
        </div>
        
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Khối lớp mặc định</label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="6">Khối 6</option>
                <option value="7">Khối 7</option>
                <option value="8">Khối 8</option>
                <option value="9">Khối 9</option>
              </select>
            </div>
            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2 cursor-pointer p-2 bg-slate-50 rounded-xl border border-slate-100 hover:bg-slate-100 transition-colors">
                <input 
                  type="checkbox" 
                  checked={seedActivity} 
                  onChange={(e) => setSeedActivity(e.target.checked)}
                  className="w-4 h-4 accent-green-600"
                />
                <span className="text-[10px] font-bold text-slate-600 uppercase leading-none">Sinh hoạt động giả</span>
              </label>
            </div>
          </div>

          {seedActivity && (
            <SeedOptionsForm options={seedOptions} setOptions={setSeedOptions} />
          )}

          <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
              <Upload size={24} />
            </div>
            <p className="text-sm font-bold text-slate-700 mb-1">Chọn file Excel (.xlsx)</p>
            <p className="text-[10px] text-slate-400 mb-4 font-medium italic">Nếu file chỉ có 1 cột Tên, hệ thống tự sinh Username</p>
            <Button 
              onClick={() => fileInputRef.current?.click()} 
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white rounded-xl h-11 px-6 font-bold"
            >
              {loading ? <RefreshCcw className="animate-spin mr-2" size={16} /> : null}
              Chọn file & Import ngay
            </Button>
            <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx" onChange={handleFileChange} />
          </div>

          <div className="space-y-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hướng dẫn & Mẫu</p>
            <Button 
              variant="outline" 
              onClick={handleDownloadTemplate}
              className="w-full justify-start gap-3 h-12 rounded-xl border-slate-200 text-slate-600 font-bold"
            >
              <Download size={18} className="text-green-600" />
              Tải file Excel mẫu (.xlsx)
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

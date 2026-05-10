import * as React from "react"
import { DataTable } from "@/components/DataTable/DataTable"
import { userColumns } from "./components/user-columns"
import { adminUserService } from "./services/user.service"
import { Plus, Trash, Search, Filter, Download, Upload, RefreshCcw, X, FileSpreadsheet, Bot, CheckCircle2, ChevronDown, ChevronUp, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { type PaginationState } from "@tanstack/react-table"
import { toast } from "sonner"
import { motion, AnimatePresence } from "motion/react"
import { cn } from "@/lib/utils"
import UserFormModal from "./components/UserFormModal"
import { ConfirmModal } from "@/components/ui/ConfirmModal"

// ==================== SEED OPTIONS UI COMPONENT ====================
function SeedOptionsForm({ options, setOptions }: { options: any, setOptions: (o: any) => void }) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  return (
    <div className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden">
      <button 
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest hover:bg-slate-100/50 transition-colors"
      >
        <span>Tùy chỉnh dữ liệu ảo</span>
        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="px-4 pb-4 space-y-4"
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase">Max XP Tháng 3</label>
                <Input 
                  type="number" 
                  value={options.xpMarch} 
                  onChange={e => setOptions({...options, xpMarch: parseInt(e.target.value)})}
                  className="h-8 rounded-lg text-xs font-bold"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase">Max XP Tháng 4</label>
                <Input 
                  type="number" 
                  value={options.xpApril} 
                  onChange={e => setOptions({...options, xpApril: parseInt(e.target.value)})}
                  className="h-8 rounded-lg text-xs font-bold"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase">Max XP Tháng 5</label>
                <Input 
                  type="number" 
                  value={options.xpMay} 
                  onChange={e => setOptions({...options, xpMay: parseInt(e.target.value)})}
                  className="h-8 rounded-lg text-xs font-bold"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase">Chuỗi Max (Ngày)</label>
                <Input 
                  type="number" 
                  value={options.maxStreak} 
                  onChange={e => setOptions({...options, maxStreak: parseInt(e.target.value)})}
                  className="h-8 rounded-lg text-xs font-bold"
                />
              </div>
            </div>
            <p className="text-[8px] text-slate-400 italic">Dữ liệu thực tế sẽ được sinh ngẫu nhiên từ 20% đến 100% giá trị Max bạn chọn.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ==================== IMPORT EXCEL MODAL ====================
interface ImportExcelModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (result: any) => void
}

function ImportExcelModal({ isOpen, onClose, onSuccess }: ImportExcelModalProps) {
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

// ==================== GENERATE MOCK MODAL ====================
interface GenerateMockModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

function GenerateMockModal({ isOpen, onClose, onSuccess }: GenerateMockModalProps) {
  const [count, setCount] = React.useState(10)
  const [grade, setGrade] = React.useState("")
  const [saveToDb, setSaveToDb] = React.useState(true)
  const [seedActivity, setSeedActivity] = React.useState(true)
  const [seedOptions, setSeedOptions] = React.useState({
    xpMarch: 250,
    xpApril: 500,
    xpMay: 550,
    maxStreak: 4
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

// ==================== IMPORT RESULT BADGE ====================
function ImportResultBadge({ result, onClose }: { result: any, onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[150] bg-white border border-slate-100 shadow-2xl rounded-2xl p-4 flex items-center gap-6 min-w-[320px]"
    >
      <div className="flex items-center gap-3 pr-6 border-r border-slate-100">
        <div className="w-10 h-10 bg-green-100 text-green-600 rounded-xl flex items-center justify-center">
          <CheckCircle2 size={20} />
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Thành công</p>
          <p className="text-lg font-black text-slate-800">{result.success}</p>
        </div>
      </div>
      
      {result.errors.length > 0 && (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-100 text-red-600 rounded-xl flex items-center justify-center">
            <X size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Lỗi</p>
            <p className="text-lg font-black text-slate-800">{result.errors.length}</p>
          </div>
        </div>
      )}

      <button onClick={onClose} className="ml-auto p-2 text-slate-400 hover:text-slate-600"><X size={16} /></button>
    </motion.div>
  )
}

// ==================== MAIN PAGE ====================
export default function UserIndex() {
  const [data, setData] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [rowSelection, setRowSelection] = React.useState({})
  const [search, setSearch] = React.useState("")
  const [roleFilter, setRoleFilter] = React.useState<string>("all")

  const [{ pageIndex, pageSize }, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })
  const [totalCount, setTotalCount] = React.useState(0)
  const [pageCount, setPageCount] = React.useState(0)

  // Modal states
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [isGenerateOpen, setIsGenerateOpen] = React.useState(false)
  const [isImportOpen, setIsImportOpen] = React.useState(false)
  const [selectedUser, setSelectedUser] = React.useState<any>(undefined)
  const [confirmDelete, setConfirmDelete] = React.useState<{ isOpen: boolean; ids: string[] }>({ isOpen: false, ids: [] })
  const [importResult, setImportResult] = React.useState<any>(null)
  const [isExporting, setIsExporting] = React.useState(false)

  // Refs
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const fetchData = React.useCallback(async () => {
    setLoading(true)
    try {
      const response = await adminUserService.getUsers({
        page: pageIndex + 1,
        limit: pageSize,
        search: search || undefined,
        role: roleFilter === "all" ? undefined : roleFilter,
      })
      setData(response.data.users)
      setTotalCount(response.data.pagination.total)
      setPageCount(response.data.pagination.totalPages)
    } catch (err: any) {
      toast.error(err.message || "Không thể tải danh sách người dùng")
    } finally {
      setLoading(false)
    }
  }, [pageIndex, pageSize, search, roleFilter])

  React.useEffect(() => {
    const timer = setTimeout(() => fetchData(), 300)
    return () => clearTimeout(timer)
  }, [fetchData])

  const handleAdd = () => { setSelectedUser(undefined); setIsModalOpen(true) }
  const handleEdit = (user: any) => { setSelectedUser(user); setIsModalOpen(true) }
  const handleDeleteOne = (id: string) => setConfirmDelete({ isOpen: true, ids: [id] })
  const handleDeleteSelected = () => {
    const ids = Object.keys(rowSelection).map(idx => data[parseInt(idx)].id)
    if (ids.length > 0) setConfirmDelete({ isOpen: true, ids })
  }

  const onConfirmDelete = async () => {
    try {
      await adminUserService.deleteUsers(confirmDelete.ids)
      toast.success(`Đã xóa ${confirmDelete.ids.length} người dùng.`)
      setRowSelection({})
      fetchData()
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi xóa người dùng.")
    }
  }

  // IMPORT EXCEL SUCCESS
  const handleImportSuccess = (result: any) => {
    setImportResult(result)
    fetchData()
  }

  // EXPORT EXCEL
  const handleExport = async () => {
    setIsExporting(true)
    try {
      await adminUserService.exportToExcel({
        role: roleFilter === "all" ? undefined : roleFilter,
        search: search || undefined,
      })
      toast.success("Đã tải xuống file Excel!")
    } catch (err: any) {
      toast.error(err.message || "Lỗi xuất file")
    } finally {
      setIsExporting(false)
    }
  }

  const selectedCount = Object.keys(rowSelection).length

  return (
    <div className="space-y-6">
      {/* Header & Main Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-slate-900 rounded-2xl text-white shadow-xl">
            <Users size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 uppercase tracking-tight">Quản lý người dùng</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hệ thống danh sách học sinh và giáo viên</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={handleExport} disabled={isExporting} className="rounded-xl border-slate-200 h-10 px-4 gap-2 text-xs font-bold hover:bg-slate-50 transition-all">
            {isExporting ? <RefreshCcw size={14} className="animate-spin" /> : <FileSpreadsheet size={16} className="text-green-600" />}
            Xuất Excel
          </Button>
          <Button variant="outline" onClick={() => setIsImportOpen(true)} className="rounded-xl border-slate-200 h-10 px-4 gap-2 text-xs font-bold hover:bg-slate-50 transition-all">
            <Upload size={16} className="text-emerald-600" />
            Nhập Excel
          </Button>
          <Button variant="outline" onClick={() => setIsGenerateOpen(true)} className="rounded-xl border-slate-200 h-10 px-4 gap-2 text-xs font-bold hover:bg-slate-50 transition-all">
            <Bot size={16} className="text-indigo-600" />
            AI Generate
          </Button>
          <Button onClick={handleAdd} className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl h-10 px-5 gap-2 text-xs font-bold shadow-lg shadow-slate-200 transition-all">
            <Plus size={16} /> Thêm mới
          </Button>
        </div>
      </div>

      {/* Stats & Selection Info */}
      <AnimatePresence>
        {selectedCount > 0 && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-sky-50 border border-sky-100 rounded-2xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-sky-100 text-sky-600 rounded-lg flex items-center justify-center font-bold text-sm">{selectedCount}</div>
              <p className="text-xs font-bold text-sky-900 uppercase tracking-widest">Đang chọn {selectedCount} người dùng</p>
            </div>
            <Button variant="ghost" onClick={handleDeleteSelected} className="text-red-500 hover:bg-red-50 font-bold text-xs gap-2 rounded-xl">
              <Trash size={14} /> Xóa đã chọn
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DataTable Area */}
      <div className="bg-white rounded-[2.5rem] p-4 sm:p-6 border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Tìm kiếm tên, username, mã số..."
              className="pl-10 h-11 border-none bg-slate-50 rounded-2xl font-bold placeholder:text-slate-400"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPagination(prev => ({ ...prev, pageIndex: 0 }))
              }}
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-2 p-1.5 bg-slate-50 rounded-2xl border border-slate-100">
              {["all", "STUDENT", "TEACHER", "ADMIN"].map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    setRoleFilter(r)
                    setPagination(prev => ({ ...prev, pageIndex: 0 }))
                  }}
                  className={cn(
                    "px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
                    roleFilter === r ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  {r === "all" ? "Tất cả" : (r === "STUDENT" ? "Học sinh" : (r === "TEACHER" ? "GV" : "Quản trị"))}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-hidden">
          <DataTable
            columns={userColumns({ onEdit: handleEdit, onDelete: handleDeleteOne })}
            data={data}
            loading={loading}
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
            pagination={{ pageIndex, pageSize }}
            onPaginationChange={setPagination}
            pageCount={pageCount}
            totalCount={totalCount}
          />
        </div>
      </div>

      {/* Modals */}
      <UserFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userData={selectedUser}
        onSuccess={fetchData}
      />

      <ImportExcelModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onSuccess={handleImportSuccess}
      />

      <GenerateMockModal
        isOpen={isGenerateOpen}
        onClose={() => setIsGenerateOpen(false)}
        onSuccess={fetchData}
      />

      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete({ isOpen: false, ids: [] })}
        onConfirm={onConfirmDelete}
        title="Xác nhận xóa"
        description={`Bạn có chắc chắn muốn xóa ${confirmDelete.ids.length} người dùng? Hành động này không thể hoàn tác.`}
      />

      {/* Status Badges */}
      <AnimatePresence>
        {importResult && (
          <ImportResultBadge
            result={importResult}
            onClose={() => setImportResult(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

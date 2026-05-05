import * as React from "react"
import { DataTable } from "@/components/DataTable/DataTable"
import { userColumns } from "./components/user-columns"
import { adminUserService } from "./services/user.service"
import { Plus, Trash2, Users, Search, Filter, Upload, Download, Sparkles, RefreshCcw, X, CheckCircle2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ConfirmModal } from "@/components/ui/ConfirmModal"
import { toast } from "sonner"
import { PaginationState } from "@tanstack/react-table"
import { motion, AnimatePresence } from "motion/react"
import UserFormModal from "./components/UserFormModal"

// ==================== AI GENERATE MODAL ====================
interface GenerateMockModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

function GenerateMockModal({ isOpen, onClose, onSuccess }: GenerateMockModalProps) {
  const [count, setCount] = React.useState(10)
  const [grade, setGrade] = React.useState("")
  const [saveToDb, setSaveToDb] = React.useState(true)
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
      // Gửi đúng data preview đã có vào DB, không gọi AI lần 2
      const res = await adminUserService.importFromJson(preview)
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
                <Sparkles size={20} />
              </div>
              <div>
                <h3 className="font-bold text-lg">Sinh dữ liệu bằng AI</h3>
                <p className="text-xs text-indigo-200">Google Gemini tự động tạo học sinh</p>
              </div>
            </div>
            <button onClick={handleClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>

        {step === "config" ? (
          <div className="p-6 space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Số lượng học sinh</label>
              <div className="flex items-center gap-3">
                <input
                  type="range" min={1} max={50} value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                  className="flex-1 accent-indigo-600"
                />
                <span className="text-2xl font-black text-indigo-600 w-10 text-center">{count}</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">Tối đa 50 học sinh mỗi lần</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Khối lớp (Tùy chọn)</label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Ngẫu nhiên (lớp 6–9)</option>
                <option value="6">Lớp 6</option>
                <option value="7">Lớp 7</option>
                <option value="8">Lớp 8</option>
                <option value="9">Lớp 9</option>
              </select>
            </div>

            <div className="bg-indigo-50 rounded-2xl p-4 text-sm text-indigo-700">
              <p className="font-semibold mb-1">✨ AI sẽ tạo tự động:</p>
              <ul className="space-y-0.5 text-xs text-indigo-600">
                <li>• Tên học sinh Việt Nam thực tế</li>
                <li>• Tên đăng nhập không dấu</li>
                <li>• Mã học sinh 8 chữ số</li>
                <li>• Mật khẩu mặc định 123456</li>
              </ul>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={handleClose} className="flex-1 rounded-2xl">Huỷ</Button>
              <Button onClick={handleGenerate} disabled={loading} className="flex-1 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
                {loading ? <RefreshCcw size={16} className="animate-spin" /> : <Sparkles size={16} />}
                {loading ? "AI đang tạo..." : "Xem trước"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-slate-700">Xem trước {preview.length} học sinh được tạo</p>
              <button onClick={() => setStep("config")} className="text-xs text-indigo-600 hover:underline">← Thay đổi cấu hình</button>
            </div>
            <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-64 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left font-bold text-slate-500 uppercase tracking-wider">Họ tên</th>
                    <th className="px-3 py-2 text-left font-bold text-slate-500 uppercase tracking-wider">Username</th>
                    <th className="px-3 py-2 text-left font-bold text-slate-500 uppercase tracking-wider">Mật khẩu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {preview.map((u, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-3 py-2 font-medium text-slate-800">{u.displayName}</td>
                      <td className="px-3 py-2 text-slate-600 font-mono">{u.username}</td>
                      <td className="px-3 py-2 text-slate-500 font-mono">{u.password}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep("config")} className="flex-1 rounded-2xl">Tạo lại</Button>
              <Button onClick={handleSave} disabled={loading} className="flex-1 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
                {loading ? <RefreshCcw size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                {loading ? "Đang lưu..." : `Lưu ${preview.length} học sinh`}
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}

// ==================== IMPORT RESULT BADGE ====================
interface ImportResultProps {
  result: { success: number; errors: any[]; total: number }
  onClose: () => void
}

function ImportResultBadge({ result, onClose }: ImportResultProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-6 right-6 z-50 bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 max-w-sm"
    >
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${result.errors.length === 0 ? "bg-green-100" : "bg-amber-100"}`}>
          {result.errors.length === 0 ? <CheckCircle2 className="text-green-600" size={20} /> : <AlertCircle className="text-amber-600" size={20} />}
        </div>
        <div className="flex-1">
          <p className="font-bold text-slate-800 text-sm">Import hoàn tất</p>
          <p className="text-xs text-slate-500 mt-0.5">
            ✅ Thành công: <b>{result.success}</b> / {result.total} &nbsp;&nbsp;
            {result.errors.length > 0 && <>❌ Lỗi: <b>{result.errors.length}</b></>}
          </p>
          {result.errors.length > 0 && (
            <div className="mt-2 text-xs space-y-1 max-h-24 overflow-y-auto">
              {result.errors.slice(0, 5).map((e: any, i: number) => (
                <p key={i} className="text-red-500">• Dòng {e.index} ({e.username}): {e.reason}</p>
              ))}
              {result.errors.length > 5 && <p className="text-slate-400">...và {result.errors.length - 5} lỗi khác</p>}
            </div>
          )}
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
      </div>
    </motion.div>
  )
}

// ==================== IMPORT EXCEL MODAL ====================
interface ImportExcelModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (result: any) => void
}

function ImportExcelModal({ isOpen, onClose, onSuccess }: ImportExcelModalProps) {
  const [loading, setLoading] = React.useState(false)
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
      const res = await adminUserService.importFromExcel(file)
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
        
        <div className="p-6 space-y-6">
          <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
              <Upload size={24} />
            </div>
            <p className="text-sm font-bold text-slate-700 mb-1">Chọn file Excel (.xlsx)</p>
            <p className="text-xs text-slate-500 mb-4">Dung lượng tối đa 5MB</p>
            <Button 
              onClick={() => fileInputRef.current?.click()} 
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white rounded-xl"
            >
              {loading ? <RefreshCcw className="animate-spin mr-2" size={16} /> : null}
              Chọn file từ máy tính
            </Button>
            <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx" onChange={handleFileChange} />
          </div>

          <div className="space-y-3">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hướng dẫn & Mẫu</p>
            <Button 
              variant="outline" 
              onClick={handleDownloadTemplate}
              className="w-full justify-start gap-3 h-12 rounded-xl border-slate-200 text-slate-600 font-bold"
            >
              <Download size={18} className="text-green-600" />
              Tải file Excel mẫu (.xlsx)
            </Button>
            <div className="text-[11px] text-slate-500 space-y-1 pl-1">
              <p>• Sử dụng đúng tên các cột trong file mẫu.</p>
              <p>• <b>Username</b> và <b>Họ tên</b> là bắt buộc.</p>
              <p>• Mật khẩu để trống sẽ tự động gán <b>123456</b>.</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-200">
            <Users size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Quản lý Người dùng</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Học sinh, Giáo viên & Quản trị viên</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {selectedCount > 0 && (
            <Button
              variant="ghost"
              onClick={handleDeleteSelected}
              className="h-10 px-4 text-xs font-bold text-red-600 hover:bg-red-50 rounded-2xl gap-2 border border-red-200"
            >
              <Trash2 size={15} /> Xóa {selectedCount}
            </Button>
          )}

          {/* Import Excel */}
          <Button
            variant="outline"
            onClick={() => setIsImportOpen(true)}
            className="h-10 px-4 rounded-2xl border-slate-200 text-xs font-bold gap-2 hover:border-green-400 hover:text-green-700 hover:bg-green-50 transition-colors"
          >
            <Upload size={15} /> Nhập Excel
          </Button>

          {/* Export Excel */}
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={isExporting}
            className="h-10 px-4 rounded-2xl border-slate-200 text-xs font-bold gap-2 hover:border-blue-400 hover:text-blue-700 hover:bg-blue-50 transition-colors"
          >
            {isExporting ? <RefreshCcw size={15} className="animate-spin" /> : <Download size={15} />}
            Xuất Excel
          </Button>

          {/* AI Generate */}
          <Button
            variant="outline"
            onClick={() => setIsGenerateOpen(true)}
            className="h-10 px-4 rounded-2xl border-slate-200 text-xs font-bold gap-2 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300 transition-colors"
          >
            <Sparkles size={15} /> Tạo bằng AI
          </Button>

          {/* Refresh */}
          <Button variant="outline" onClick={fetchData} className="h-10 w-10 p-0 rounded-2xl border-slate-200">
            <RefreshCcw size={16} className={loading ? "animate-spin" : ""} />
          </Button>

          {/* Add new */}
          <Button onClick={handleAdd} className="h-10 px-5 gap-2 rounded-2xl bg-slate-900 text-white font-bold hover:bg-slate-800 shadow-lg transition-all">
            <Plus size={16} /> Thêm mới
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Tìm theo tên, username, email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPagination(p => ({ ...p, pageIndex: 0 })) }}
            className="pl-10 h-11 bg-white border-slate-200 rounded-2xl focus:ring-sky-500/20 shadow-sm"
          />
        </div>

        <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-2xl shadow-sm">
          <Filter size={14} className="text-slate-400" />
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPagination(p => ({ ...p, pageIndex: 0 })) }}
            className="bg-transparent border-none outline-none text-xs font-bold text-slate-600 pr-4 appearance-none cursor-pointer"
          >
            <option value="all">Tất cả vai trò</option>
            <option value="STUDENT">Học sinh</option>
            <option value="TEACHER">Giáo viên</option>
            <option value="ADMIN">Quản trị viên</option>
          </select>
        </div>

        {/* Stats badges */}
        <div className="flex items-center gap-2 ml-auto text-xs text-slate-500">
          <span className="bg-slate-100 rounded-xl px-3 py-1.5 font-semibold">{totalCount} người dùng</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        <DataTable
          columns={userColumns}
          data={data}
          loading={loading}
          totalCount={totalCount}
          pageCount={pageCount}
          pagination={{ pageIndex, pageSize }}
          onPaginationChange={setPagination}
          meta={{ onEdit: handleEdit, onDelete: handleDeleteOne }}
          onRowSelectionChange={setRowSelection}
          state={{ rowSelection }}
        />
      </div>

      {/* Modals */}
      <UserFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchData}
        userData={selectedUser}
      />

      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete({ isOpen: false, ids: [] })}
        onConfirm={onConfirmDelete}
        title="Xác nhận xóa người dùng"
        description={`Bạn có chắc chắn muốn xóa ${confirmDelete.ids.length} người dùng? Toàn bộ dữ liệu học tập của họ sẽ bị xóa vĩnh viễn.`}
      />

      <GenerateMockModal
        isOpen={isGenerateOpen}
        onClose={() => setIsGenerateOpen(false)}
        onSuccess={fetchData}
      />

      <ImportExcelModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onSuccess={handleImportSuccess}
      />

      {/* Import Result Toast Overlay */}
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

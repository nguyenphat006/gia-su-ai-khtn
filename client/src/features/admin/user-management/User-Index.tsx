import * as React from "react"
import { DataTable } from "@/components/DataTable/DataTable"
import { userColumns } from "./components/user-columns"
import { adminUserService } from "./services/user.service"
import { Plus, Trash, Search, RefreshCcw, FileSpreadsheet, Bot, Upload, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { type PaginationState } from "@tanstack/react-table"
import { toast } from "sonner"
import { motion, AnimatePresence } from "motion/react"
import { cn } from "@/lib/utils"
import UserFormModal from "./components/UserFormModal"
import { ConfirmModal } from "@/components/ui/ConfirmModal"

// Imported Sub-components
import { ImportExcelModal } from "./components/ImportExcelModal"
import { GenerateMockModal } from "./components/GenerateMockModal"
import { ImportResultBadge } from "./components/ImportResultBadge"

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

  const handleImportSuccess = (result: any) => {
    setImportResult(result)
    fetchData()
  }

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

      {/* Selection Info */}
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

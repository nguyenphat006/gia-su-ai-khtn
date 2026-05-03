import * as React from "react"
import { DataTable } from "@/components/DataTable/DataTable"
import { userColumns } from "./components/user-columns"
import { adminUserService } from "./services/user.service"
import { Plus, RefreshCcw, Trash2, Users, Search, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ConfirmModal } from "@/components/ui/ConfirmModal"
import { toast } from "sonner"
import { PaginationState } from "@tanstack/react-table"
import { motion } from "motion/react"

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

  const [confirmDelete, setConfirmDelete] = React.useState<{ isOpen: boolean; ids: string[] }>({ isOpen: false, ids: [] })

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

  const handleDeleteOne = (id: string) => {
    setConfirmDelete({ isOpen: true, ids: [id] })
  }

  const handleDeleteSelected = () => {
    const ids = Object.keys(rowSelection).map(idx => data[parseInt(idx)].id)
    if (ids.length > 0) {
      setConfirmDelete({ isOpen: true, ids })
    }
  }

  const onConfirmDelete = async () => {
    try {
      await adminUserService.deleteUsers(confirmDelete.ids)
      toast.success(`Đã xóa thành công ${confirmDelete.ids.length} người dùng.`)
      setRowSelection({})
      fetchData()
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi xóa người dùng.")
    }
  }

  const selectedCount = Object.keys(rowSelection).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg">
                <Users size={24} />
            </div>
            <div>
                <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Quản lý Người dùng</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Học sinh, Giáo viên & Quản trị viên</p>
            </div>
        </div>

        <div className="flex items-center gap-3">
          {selectedCount > 0 && (
             <Button 
                variant="ghost" 
                onClick={handleDeleteSelected}
                className="h-11 px-4 text-xs font-bold text-red-600 hover:bg-red-50 rounded-2xl gap-2"
             >
                <Trash2 size={16} /> Xóa {selectedCount} mục
             </Button>
          )}
          <Button variant="outline" onClick={fetchData} className="h-11 w-11 p-0 rounded-2xl border-slate-200">
            <RefreshCcw size={18} className={loading ? "animate-spin" : ""} />
          </Button>
          <Button className="h-11 px-6 gap-2 rounded-2xl bg-slate-900 text-white font-bold hover:bg-slate-800 shadow-lg transition-all">
            <Plus size={18} /> Thêm người dùng
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Tìm theo tên, username, email..."
              value={search}
              onChange={(e) => {
                  setSearch(e.target.value)
                  setPagination(p => ({ ...p, pageIndex: 0 }))
              }}
              className="pl-10 h-11 bg-white border-slate-200 rounded-2xl focus:ring-sky-500/20 shadow-sm"
            />
          </div>

          <div className="flex items-center gap-2 bg-white border border-slate-200 p-1.5 rounded-2xl shadow-sm">
             <Filter size={14} className="ml-2 text-slate-400" />
             <select 
               value={roleFilter}
               onChange={(e) => {
                   setRoleFilter(e.target.value)
                   setPagination(p => ({ ...p, pageIndex: 0 }))
               }}
               className="bg-transparent border-none outline-none text-xs font-bold text-slate-600 px-2 pr-4 appearance-none cursor-pointer"
             >
                <option value="all">Tất cả Vai trò</option>
                <option value="STUDENT">Học sinh</option>
                <option value="TEACHER">Giáo viên</option>
                <option value="ADMIN">Quản trị viên</option>
             </select>
          </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <DataTable
          columns={userColumns}
          data={data}
          loading={loading}
          totalCount={totalCount}
          pageCount={pageCount}
          pagination={{ pageIndex, pageSize }}
          onPaginationChange={setPagination}
          meta={{
            onEdit: (u: any) => toast.info("Tính năng sửa người dùng đang được hoàn thiện"),
            onDelete: handleDeleteOne,
          }}
          onRowSelectionChange={setRowSelection}
          state={{ rowSelection }}
        />
      </div>

      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete({ isOpen: false, ids: [] })}
        onConfirm={onConfirmDelete}
        title="Xác nhận xóa người dùng"
        description={`Bạn có chắc chắn muốn xóa ${confirmDelete.ids.length} người dùng đã chọn? Mọi dữ liệu liên quan đến học tập của họ sẽ bị xóa sạch.`}
      />
    </div>
  )
}

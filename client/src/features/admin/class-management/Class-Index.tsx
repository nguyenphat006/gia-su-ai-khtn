import * as React from "react"
import { DataTable } from "@/components/DataTable/DataTable"
import { classColumns } from "./components/class-columns"
import { adminClassService } from "./services/class.service"
import { Plus, RefreshCcw, Trash2, School } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ConfirmModal } from "@/components/ui/ConfirmModal"
import { toast } from "sonner"
import { PaginationState } from "@tanstack/react-table"
import { motion } from "motion/react"
import ClassFormModal from "./components/ClassFormModal"

export default function ClassIndex() {
  const [data, setData] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [rowSelection, setRowSelection] = React.useState({})
  
  const [{ pageIndex, pageSize }, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })
  const [totalCount, setTotalCount] = React.useState(0)
  const [pageCount, setPageCount] = React.useState(0)

  // Modal states
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [selectedClass, setSelectedClass] = React.useState<any>(undefined)
  const [confirmDelete, setConfirmDelete] = React.useState<{ isOpen: boolean; ids: string[] }>({ isOpen: false, ids: [] })

  const fetchData = React.useCallback(async () => {
    setLoading(true)
    try {
      const response = await adminClassService.getClasses({
        page: pageIndex + 1,
        limit: pageSize,
      })
      setData(response.data.classes)
      setTotalCount(response.data.pagination.total)
      setPageCount(response.data.pagination.totalPages)
    } catch (err: any) {
      toast.error(err.message || "Không thể tải danh sách lớp học")
    } finally {
      setLoading(false)
    }
  }, [pageIndex, pageSize])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleAdd = () => {
    setSelectedClass(undefined)
    setIsModalOpen(true)
  }

  const handleEdit = (cls: any) => {
    setSelectedClass(cls)
    setIsModalOpen(true)
  }

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
      await adminClassService.deleteClasses(confirmDelete.ids)
      toast.success(`Đã xóa thành công ${confirmDelete.ids.length} lớp học.`)
      setRowSelection({})
      fetchData()
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi xóa lớp học.")
    }
  }

  const selectedCount = Object.keys(rowSelection).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
            <div className="p-3 bg-sky-600 rounded-2xl text-white shadow-lg">
                <School size={24} />
            </div>
            <div>
                <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Quản lý Lớp học</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Danh sách các lớp trong hệ thống</p>
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
          <Button onClick={handleAdd} className="h-11 px-6 gap-2 rounded-2xl bg-slate-900 text-white font-bold hover:bg-slate-800 shadow-lg transition-all">
            <Plus size={18} /> Thêm lớp mới
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <DataTable
          columns={classColumns}
          data={data}
          loading={loading}
          totalCount={totalCount}
          pageCount={pageCount}
          pagination={{ pageIndex, pageSize }}
          onPaginationChange={setPagination}
          meta={{
            onEdit: handleEdit,
            onDelete: handleDeleteOne,
          }}
          onRowSelectionChange={setRowSelection}
          state={{ rowSelection }}
        />
      </div>

      <ClassFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchData}
        classData={selectedClass}
      />

      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete({ isOpen: false, ids: [] })}
        onConfirm={onConfirmDelete}
        title="Xác nhận xóa lớp học"
        description={`Bạn có chắc chắn muốn xóa ${confirmDelete.ids.length} lớp học đã chọn? Học sinh trong các lớp này sẽ bị mất liên kết.`}
      />
    </div>
  )
}

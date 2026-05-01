import * as React from "react"
import { motion } from "motion/react"
import { 
  PaginationState, 
  SortingState 
} from "@tanstack/react-table"
import { DataTable } from "@/components/DataTable/DataTable"
import { columns } from "./components/columns"
import { knowledgeService } from "./services/knowledge.service"
import { KnowledgeDocument } from "./types"
import { Input } from "@/components/ui/input"
import { Search, Plus, Filter, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import KnowledgeFormModal from "./components/KnowledgeFormModal"
import { ConfirmModal } from "@/components/ui/ConfirmModal"
import { toast } from "sonner"

export default function KnowledgeList() {
  const [data, setData] = React.useState<KnowledgeDocument[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [rowSelection, setRowSelection] = React.useState({})
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [selectedDoc, setSelectedDoc] = React.useState<KnowledgeDocument | undefined>()

  // Confirm Modal state
  const [confirmDelete, setConfirmDelete] = React.useState<{ 
    isOpen: boolean; 
    ids?: string[];
    title: string;
    description: string;
  }>({ 
    isOpen: false, 
    title: "", 
    description: "" 
  })

  // Pagination state
  const [{ pageIndex, pageSize }, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })

  // Sorting state
  const [sorting, setSorting] = React.useState<SortingState>([])
  
  // Search state
  const [search, setSearch] = React.useState("")
  const [totalCount, setTotalCount] = React.useState(0)
  const [pageCount, setPageCount] = React.useState(0)

  const fetchData = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await knowledgeService.getDocuments({
        page: pageIndex + 1,
        limit: pageSize,
        search,
      })

      setData(response.data.documents)
      setTotalCount(response.data.pagination.total)
      setPageCount(response.data.pagination.totalPages)
    } catch (err: any) {
      setError(err.message || "Không thể tải danh sách tài liệu")
    } finally {
      setLoading(false)
    }
  }, [pageIndex, pageSize, search])

  React.useEffect(() => {
    const timer = setTimeout(() => {
        fetchData()
    }, 300) // Debounce search
    return () => clearTimeout(timer)
  }, [fetchData])

  const handleEdit = (doc: KnowledgeDocument) => {
    setSelectedDoc(doc)
    setIsModalOpen(true)
  }

  const handleDeleteOne = async (id: string) => {
    setConfirmDelete({ 
      isOpen: true, 
      ids: [id],
      title: "Xác nhận xóa tài liệu",
      description: "Hành động này không thể hoàn tác. Tài liệu này sẽ bị xóa vĩnh viễn khỏi kho tri thức."
    })
  }

  const handleDeleteSelected = () => {
    const selectedIds = Object.keys(rowSelection).map(
      (index) => data[parseInt(index)].id
    )

    if (selectedIds.length === 0) return

    setConfirmDelete({
      isOpen: true,
      ids: selectedIds,
      title: `Xác nhận xóa ${selectedIds.length} tài liệu`,
      description: `Hành động này sẽ xóa vĩnh viễn các tài liệu đã chọn. Bạn có chắc chắn muốn tiếp tục?`
    })
  }

  const onConfirmDelete = async () => {
    const ids = confirmDelete.ids
    if (!ids || ids.length === 0) return

    try {
      await knowledgeService.deleteDocuments(ids)
      toast.success(ids.length > 1 ? `Đã xóa ${ids.length} tài liệu thành công!` : "Đã xóa tài liệu thành công!")
      setRowSelection({})
      fetchData()
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi xóa tài liệu.")
    }
  }

  const selectedCount = Object.keys(rowSelection).length

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Tìm kiếm tài liệu..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-11 bg-white border-slate-200 rounded-2xl focus:ring-sky-500/20"
            />
          </div>

          {selectedCount > 0 && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="hidden sm:flex items-center gap-3 bg-slate-100 p-2 pl-4 rounded-2xl border border-slate-200"
            >
              <span className="text-xs font-bold text-slate-600">Đã chọn <span className="text-slate-900">{selectedCount}</span> mục</span>
              <div className="h-4 w-px bg-slate-300 mx-1" />
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleDeleteSelected}
                className="h-8 px-3 text-xs font-bold text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl gap-2"
              >
                <Trash2 size={14} />
                Xóa
              </Button>
            </motion.div>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" className="h-11 px-4 gap-2 rounded-2xl border-slate-200 font-bold text-slate-600">
            <Filter size={18} />
            Bộ lọc
          </Button>
          <Button 
            onClick={() => {
              setSelectedDoc(undefined)
              setIsModalOpen(true)
            }}
            className="h-11 px-6 gap-2 rounded-2xl bg-slate-900 text-white font-bold hover:bg-slate-800 shadow-lg shadow-slate-200 transition-all"
          >
            <Plus size={18} />
            Thêm tài liệu
          </Button>
        </div>
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        error={error}
        totalCount={totalCount}
        pageCount={pageCount}
        pagination={{ pageIndex, pageSize }}
        onPaginationChange={setPagination}
        sorting={sorting}
        onSortingChange={setSorting}
        onRowSelectionChange={setRowSelection}
        state={{ rowSelection }}
        meta={{
          onEdit: handleEdit,
          onDelete: handleDeleteOne,
        }}
      />

      {/* Form Modal */}
      <KnowledgeFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchData}
        document={selectedDoc}
      />

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete(prev => ({ ...prev, isOpen: false }))}
        onConfirm={onConfirmDelete}
        title={confirmDelete.title}
        description={confirmDelete.description}
        confirmText={confirmDelete.ids && confirmDelete.ids.length > 1 ? "Xóa tất cả" : "Xóa ngay"}
      />
    </div>
  )
}

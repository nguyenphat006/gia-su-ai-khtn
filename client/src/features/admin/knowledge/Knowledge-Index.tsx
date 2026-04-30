import * as React from "react"
import { 
  PaginationState, 
  SortingState 
} from "@tanstack/react-table"
import { DataTable } from "@/components/DataTable/DataTable"
import { columns } from "./components/columns"
import { knowledgeService } from "./services/knowledge.service"
import { KnowledgeDocument } from "./types"
import { Input } from "@/components/ui/input"
import { Search, Plus, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import KnowledgeFormModal from "./components/KnowledgeFormModal"

export default function KnowledgeList() {
  const [data, setData] = React.useState<KnowledgeDocument[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [selectedDoc, setSelectedDoc] = React.useState<KnowledgeDocument | undefined>()

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

  const handleDelete = async (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa tài liệu này?")) {
      try {
        await knowledgeService.deleteDocument(id)
        fetchData()
      } catch (err: any) {
        alert(err.message || "Lỗi khi xóa tài liệu.")
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Tìm kiếm tài liệu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-11 bg-white border-slate-200 rounded-2xl focus:ring-sky-500/20"
          />
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
        meta={{
          onEdit: handleEdit,
          onDelete: handleDelete,
        }}
      />

      {/* Form Modal */}
      <KnowledgeFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchData}
        document={selectedDoc}
      />
    </div>
  )
}

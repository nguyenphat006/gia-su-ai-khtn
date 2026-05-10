import * as React from "react"
import { motion } from "motion/react"
import { Search, Plus, Trash2, RefreshCw } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/DataTable/DataTable"
import { columns } from "./columns"
import { knowledgeService } from "../services/knowledge.service"
import { KnowledgeDocument } from "../types"
import { PaginationState, SortingState } from "@tanstack/react-table"
import { toast } from "sonner"

interface KnowledgeRagTabProps {
  onEdit: (doc: KnowledgeDocument) => void
  onDelete: (id: string) => void
  refreshTrigger?: number
}

export function KnowledgeRagTab({ onEdit, onDelete, refreshTrigger }: KnowledgeRagTabProps) {
  const [data, setData] = React.useState<KnowledgeDocument[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [rowSelection, setRowSelection] = React.useState({})
  const [search, setSearch] = React.useState("")
  const [totalCount, setTotalCount] = React.useState(0)
  const [pageCount, setPageCount] = React.useState(0)
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [{ pageIndex, pageSize }, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })

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
  }, [pageIndex, pageSize, search, refreshTrigger])

  React.useEffect(() => {
    const timer = setTimeout(() => {
        fetchData()
    }, 300)
    return () => clearTimeout(timer)
  }, [fetchData])

  const handleDeleteSelected = async () => {
    const selectedIds = Object.keys(rowSelection).map(
      (index) => data[parseInt(index)].id
    )

    if (selectedIds.length === 0) return
    if (!window.confirm(`Xóa ${selectedIds.length} tài liệu đã chọn?`)) return

    try {
      await knowledgeService.deleteDocuments(selectedIds)
      toast.success("Đã xóa các tài liệu thành công!")
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
              placeholder="Tìm kiếm tri thức..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-11 bg-white border-slate-200 rounded-2xl focus:ring-sky-500/20"
            />
          </div>

          {selectedCount > 0 && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-3 bg-red-50 p-2 pl-4 rounded-2xl border border-red-100"
            >
              <span className="text-[10px] font-bold text-red-600 uppercase tracking-widest">Đã chọn {selectedCount} mục</span>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleDeleteSelected}
                className="h-8 px-3 text-xs font-bold text-red-600 hover:bg-white hover:text-red-700 rounded-xl gap-2 shadow-sm"
              >
                <Trash2 size={14} />
                Xóa tất cả
              </Button>
            </motion.div>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => fetchData()} className="h-11 w-11 p-0 rounded-2xl border-slate-200 text-slate-400 hover:text-sky-600 transition-all">
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </Button>
          <Button 
            onClick={() => onEdit({} as any)} // For adding new
            className="h-11 px-6 gap-2 rounded-2xl bg-slate-900 text-white font-bold hover:bg-slate-800 shadow-lg shadow-slate-200 transition-all"
          >
            <Plus size={18} />
            Thêm tri thức
          </Button>
        </div>
      </div>

      {/* DataTable */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
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
                onEdit,
                onDelete,
            }}
          />
      </div>
    </div>
  )
}

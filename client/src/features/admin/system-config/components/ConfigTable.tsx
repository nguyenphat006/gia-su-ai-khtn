import * as React from "react"
import { DataTable } from "@/components/DataTable/DataTable"
import { columns } from "./columns"
import { systemService } from "../services/system.service"
import { Search, RefreshCw, Trash2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { type PaginationState } from "@tanstack/react-table"
import { toast } from "sonner"
import { motion, AnimatePresence } from "motion/react"

interface ConfigTableProps {
  onEdit: (config: any) => void
  onDelete: (keys: string[]) => void
  refreshTrigger?: number
}

export function ConfigTable({ onEdit, onDelete, refreshTrigger }: ConfigTableProps) {
  const [data, setData] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [rowSelection, setRowSelection] = React.useState({})
  const [search, setSearch] = React.useState("")

  const fetchData = React.useCallback(async () => {
    setLoading(true)
    try {
      const response = await systemService.getConfigs({
        search: search || undefined,
      })
      setData(response.data.configs)
    } catch (err: any) {
      toast.error(err.message || "Không thể tải cấu hình hệ thống")
    } finally {
      setLoading(false)
    }
  }, [search, refreshTrigger])

  React.useEffect(() => {
    const timer = setTimeout(() => fetchData(), 300)
    return () => clearTimeout(timer)
  }, [fetchData])

  const handleDeleteSelected = async () => {
    const keys = Object.keys(rowSelection).map(idx => data[parseInt(idx)].key)
    if (keys.length === 0) return
    onDelete(keys)
  }

  const selectedCount = Object.keys(rowSelection).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Tìm kiếm cấu hình..."
              className="pl-10 h-11 bg-white border-slate-200 rounded-2xl"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <AnimatePresence>
            {selectedCount > 0 && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="flex items-center gap-3 bg-red-50 p-2 pl-4 rounded-2xl border border-red-100">
                <span className="text-[10px] font-bold text-red-600 uppercase tracking-widest">Đã chọn {selectedCount} mục</span>
                <Button variant="ghost" size="sm" onClick={handleDeleteSelected} className="h-8 px-3 text-xs font-bold text-red-600 hover:bg-white hover:text-red-700 rounded-xl gap-2 shadow-sm">
                  <Trash2 size={14} /> Xóa tất cả
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={fetchData} className="h-11 w-11 p-0 rounded-2xl border-slate-200 text-slate-400 hover:text-sky-600 transition-all">
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </Button>
          <Button onClick={() => onEdit(undefined)} className="h-11 px-6 gap-2 rounded-2xl bg-slate-900 text-white font-bold hover:bg-slate-800 shadow-lg shadow-slate-200 transition-all">
            <Plus size={18} /> Thêm cấu hình
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <DataTable
          columns={columns({ onEdit, onDelete: (key) => onDelete([key]) })}
          data={data}
          loading={loading}
          rowSelection={rowSelection}
          onRowSelectionChange={setRowSelection}
          hidePagination
        />
      </div>
    </div>
  )
}

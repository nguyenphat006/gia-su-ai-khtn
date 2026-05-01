import * as React from "react"
import { motion } from "motion/react"
import { DataTable } from "@/components/DataTable/DataTable"
import { columns } from "./components/columns"
import { systemService } from "./services/system.service"
import { SystemConfig } from "./types"
import { Plus, RefreshCcw, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import SystemConfigModal from "./components/SystemConfigModal"
import { ConfirmModal } from "@/components/ui/ConfirmModal"
import { toast } from "sonner"

export default function SystemConfigIndex() {
  const [data, setData] = React.useState<SystemConfig[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [rowSelection, setRowSelection] = React.useState({})
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [selectedConfig, setSelectedConfig] = React.useState<SystemConfig | undefined>()

  // Confirm Modal state
  const [confirmDelete, setConfirmDelete] = React.useState<{ 
    isOpen: boolean; 
    keys?: string[];
    title: string;
    description: string;
  }>({ 
    isOpen: false, 
    title: "", 
    description: "" 
  })

  const fetchData = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await systemService.getConfigs()
      setData(response.data.configs)
    } catch (err: any) {
      setError(err.message || "Không thể tải cấu hình hệ thống")
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleEdit = (config: SystemConfig) => {
    setSelectedConfig(config)
    setIsModalOpen(true)
  }

  const handleDeleteOne = async (key: string) => {
    setConfirmDelete({ 
      isOpen: true, 
      keys: [key],
      title: "Xác nhận xóa cấu hình",
      description: `Bạn có chắc chắn muốn xóa cấu hình "${key}"? Hành động này không thể hoàn tác.`
    })
  }

  const handleDeleteSelected = () => {
    const selectedKeys = Object.keys(rowSelection).map(
      (index) => data[parseInt(index)].key
    ).filter(key => key !== "AI_SYSTEM_PROMPT")

    if (selectedKeys.length === 0) return

    setConfirmDelete({
      isOpen: true,
      keys: selectedKeys,
      title: `Xác nhận xóa ${selectedKeys.length} cấu hình`,
      description: `Hành động này sẽ xóa vĩnh viễn các cấu hình đã chọn. Bạn có chắc chắn muốn tiếp tục?`
    })
  }

  const onConfirmDelete = async () => {
    const keys = confirmDelete.keys
    if (!keys || keys.length === 0) return

    try {
      await systemService.deleteConfigs(keys)
      toast.success(keys.length > 1 ? `Đã xóa ${keys.length} cấu hình thành công!` : "Đã xóa cấu hình thành công!")
      setRowSelection({})
      fetchData()
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi xóa cấu hình.")
    }
  }

  const selectedCount = Object.keys(rowSelection).length

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          {selectedCount > 0 && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 bg-slate-100 p-2 pl-4 rounded-2xl border border-slate-200"
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
                Xóa các mục đã chọn
              </Button>
            </motion.div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={fetchData}
            className="h-11 w-11 p-0 rounded-2xl border-slate-200"
          >
            <RefreshCcw size={18} className={loading ? "animate-spin" : ""} />
          </Button>
          <Button 
            onClick={() => {
              setSelectedConfig(undefined)
              setIsModalOpen(true)
            }}
            className="h-11 px-6 gap-2 rounded-2xl bg-slate-900 text-white font-bold hover:bg-slate-800 shadow-lg shadow-slate-200 transition-all"
          >
            <Plus size={18} />
            Thêm cấu hình
          </Button>
        </div>
      </div>

      {/* DataTable */}
      <div className="no-pagination">
        <DataTable
          columns={columns}
          data={data}
          loading={loading}
          error={error}
          totalCount={data.length}
          meta={{
            onEdit: handleEdit,
            onDelete: handleDeleteOne,
          }}
          onRowSelectionChange={setRowSelection}
          state={{ rowSelection }}
        />
      </div>

      {/* Form Modal */}
      <SystemConfigModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchData}
        config={selectedConfig}
      />

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete(prev => ({ ...prev, isOpen: false }))}
        onConfirm={onConfirmDelete}
        title={confirmDelete.title}
        description={confirmDelete.description}
        confirmText={confirmDelete.keys && confirmDelete.keys.length > 1 ? "Xóa tất cả" : "Xóa cấu hình"}
      />
    </div>
  )
}

import * as React from "react"
import { DataTable } from "@/components/DataTable/DataTable"
import { columns } from "./components/columns"
import { systemService } from "./services/system.service"
import { SystemConfig } from "./types"
import { Plus, RefreshCcw, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import SystemConfigModal from "./components/SystemConfigModal"

export default function SystemConfigIndex() {
  const [data, setData] = React.useState<SystemConfig[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [selectedConfig, setSelectedConfig] = React.useState<SystemConfig | undefined>()

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

  const handleDelete = async (key: string) => {
    if (confirm(`Bạn có chắc chắn muốn xóa cấu hình "${key}"?`)) {
      try {
        await systemService.deleteConfig(key)
        fetchData()
      } catch (err: any) {
        alert(err.message || "Lỗi khi xóa cấu hình.")
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-slate-900 rounded-xl text-white">
            <Settings size={20} />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Biến môi trường AI</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Quản lý các tham số vận hành hệ thống</p>
          </div>
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
      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        error={error}
        totalCount={data.length}
        meta={{
          onEdit: handleEdit,
          onDelete: handleDelete,
        }}
      />

      {/* Form Modal */}
      <SystemConfigModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchData}
        config={selectedConfig}
      />
    </div>
  )
}

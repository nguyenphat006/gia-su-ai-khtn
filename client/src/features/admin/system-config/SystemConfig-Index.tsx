import * as React from "react"
import { systemService } from "./services/system.service"
import { ConfirmModal } from "@/components/ui/ConfirmModal"
import { toast } from "sonner"
import { ConfigTable } from "./components/ConfigTable"
import SystemConfigModal from "./components/SystemConfigModal"

export default function SystemConfig() {
  const [refreshTrigger, setRefreshTrigger] = React.useState(0)
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [selectedConfig, setSelectedConfig] = React.useState<any>(undefined)
  const [confirmDelete, setConfirmDelete] = React.useState<{ isOpen: boolean; keys: string[]; title: string; description: string }>({ 
    isOpen: false, 
    keys: [],
    title: "",
    description: ""
  })

  const handleRefresh = () => setRefreshTrigger(prev => prev + 1)

  const handleEdit = (config: any) => {
    setSelectedConfig(config)
    setIsModalOpen(true)
  }

  const handleDelete = (keys: string[]) => {
    setConfirmDelete({ 
      isOpen: true, 
      keys,
      title: "Xác nhận xóa cấu hình",
      description: `Bạn có chắc chắn muốn xóa ${keys.length} cấu hình đã chọn? Hành động này không thể hoàn tác.`
    })
  }

  const onConfirmDelete = async () => {
    try {
      // Logic xóa cấu hình (API deleteMany theo key)
      await systemService.deleteConfigs(confirmDelete.keys)
      toast.success(`Đã xóa thành công ${confirmDelete.keys.length} mục.`)
      handleRefresh()
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi xóa cấu hình.")
    } finally {
      setConfirmDelete({ isOpen: false, keys: [], title: "", description: "" })
    }
  }

  return (
    <>
      <ConfigTable 
        onEdit={handleEdit}
        onDelete={handleDelete}
        refreshTrigger={refreshTrigger}
      />

      {/* Modals */}
      <SystemConfigModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        config={selectedConfig}
        onSuccess={handleRefresh}
      />

      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete({ isOpen: false, keys: [], title: "", description: "" })}
        onConfirm={onConfirmDelete}
        title={confirmDelete.title}
        description={confirmDelete.description}
      />
    </>
  )
}

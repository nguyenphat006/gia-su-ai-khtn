import * as React from "react"
import { adminClassService } from "./services/class.service"
import { ConfirmModal } from "@/components/ui/ConfirmModal"
import { toast } from "sonner"
import { ClassListTable } from "./components/ClassListTable"
import ClassFormModal from "./components/ClassFormModal"

export default function ClassList() {
  const [refreshTrigger, setRefreshTrigger] = React.useState(0)

  // Modal states
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [selectedClass, setSelectedClass] = React.useState<any>(undefined)
  const [confirmDelete, setConfirmDelete] = React.useState<{ isOpen: boolean; ids: string[] }>({ isOpen: false, ids: [] })

  const handleRefresh = () => setRefreshTrigger(prev => prev + 1)

  const handleEdit = (cls: any) => {
    setSelectedClass(cls)
    setIsModalOpen(true)
  }

  const handleDelete = (id: string) => {
    setConfirmDelete({ isOpen: true, ids: [id] })
  }

  const onConfirmDelete = async () => {
    try {
      await adminClassService.deleteClasses(confirmDelete.ids)
      toast.success(`Đã xóa thành công ${confirmDelete.ids.length} lớp học.`)
      handleRefresh()
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi xóa lớp học.")
    } finally {
      setConfirmDelete({ isOpen: false, ids: [] })
    }
  }

  return (
    <>
      <ClassListTable
        onEdit={handleEdit}
        onDelete={handleDelete}
        refreshTrigger={refreshTrigger}
      />

      {/* Modals */}
      <ClassFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        classData={selectedClass}
        onSuccess={handleRefresh}
      />

      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete({ isOpen: false, ids: [] })}
        onConfirm={onConfirmDelete}
        title="Xác nhận xóa lớp học"
        description={`Bạn có chắc chắn muốn xóa ${confirmDelete.ids.length} lớp học đã chọn? Học sinh trong các lớp này sẽ bị mất liên kết.`}
      />
    </>
  )
}

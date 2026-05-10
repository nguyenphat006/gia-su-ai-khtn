import * as React from "react"
import { adminRevisionService } from "./services/revision.service"
import { ConfirmModal } from "@/components/ui/ConfirmModal"
import { toast } from "sonner"
import AiDraftModal from "./components/AiDraftModal"
import QuizFormModal from "./components/QuizFormModal"
import FlashcardFormModal from "./components/FlashcardFormModal"
import MindmapFormModal from "./components/MindmapFormModal"
import { RevisionListTab } from "./components/RevisionListTab"

export default function RevisionIndex() {
  const [activeTab, setActiveTab] = React.useState("quiz")
  const [refreshTrigger, setRefreshTrigger] = React.useState(0)
  
  // Modal states
  const [isAiModalOpen, setIsAiModalOpen] = React.useState(false)
  const [isFormModalOpen, setIsFormModalOpen] = React.useState(false)
  const [selectedItem, setSelectedItem] = React.useState<any>(undefined)
  const [confirmDelete, setConfirmDelete] = React.useState<{ isOpen: boolean; ids: string[] }>({ isOpen: false, ids: [] })

  const handleRefresh = () => setRefreshTrigger(prev => prev + 1)

  const handleEdit = (item: any) => {
    setSelectedItem(item)
    setIsFormModalOpen(true)
  }

  const handleDelete = (ids: string[]) => {
    setConfirmDelete({ isOpen: true, ids })
  }

  const onConfirmDelete = async () => {
    try {
        if (activeTab === "quiz") await adminRevisionService.deleteQuestions(confirmDelete.ids)
        else if (activeTab === "flashcard") await adminRevisionService.deleteFlashcards(confirmDelete.ids)
        else if (activeTab === "mindmap") await adminRevisionService.deleteMindmaps(confirmDelete.ids)
        
        toast.success(`Đã xóa thành công ${confirmDelete.ids.length} mục.`)
        handleRefresh()
    } catch (err: any) {
        toast.error(err.message || "Lỗi khi xóa dữ liệu.")
    } finally {
        setConfirmDelete({ isOpen: false, ids: [] })
    }
  }

  return (
    <>
      <RevisionListTab 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAiDraft={() => setIsAiModalOpen(true)}
        onAddManual={() => { setSelectedItem(undefined); setIsFormModalOpen(true); }}
        refreshTrigger={refreshTrigger}
      />

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete({ isOpen: false, ids: [] })}
        onConfirm={onConfirmDelete}
        title="Xác nhận xóa dữ liệu"
        description={`Bạn có chắc chắn muốn xóa ${confirmDelete.ids.length} mục đã chọn? Hành động này không thể hoàn tác.`}
      />

      {/* AI Draft Modal */}
      <AiDraftModal 
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onSuccess={handleRefresh}
      />

      {/* Manual Form Modals */}
      {activeTab === "quiz" && (
        <QuizFormModal 
          isOpen={isFormModalOpen}
          onClose={() => setIsFormModalOpen(false)}
          onSuccess={handleRefresh}
          quiz={selectedItem}
        />
      )}
      {activeTab === "flashcard" && (
        <FlashcardFormModal 
          isOpen={isFormModalOpen}
          onClose={() => setIsFormModalOpen(false)}
          onSuccess={handleRefresh}
          deck={selectedItem}
        />
      )}
      {activeTab === "mindmap" && (
        <MindmapFormModal 
          isOpen={isFormModalOpen}
          onClose={() => setIsFormModalOpen(false)}
          onSuccess={handleRefresh}
          mindmap={selectedItem}
        />
      )}
    </>
  )
}

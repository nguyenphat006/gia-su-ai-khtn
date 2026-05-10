import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import { Database, FileText } from "lucide-react"
import { KnowledgeDocument } from "./types"
import KnowledgeFormModal from "./components/KnowledgeFormModal"
import { ConfirmModal } from "@/components/ui/ConfirmModal"
import { knowledgeService } from "./services/knowledge.service"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { SourceDocumentTab } from "./components/SourceDocumentTab"
import { KnowledgeRagTab } from "./components/KnowledgeRagTab"

const TABS = [
  { id: "rag", label: "Dữ liệu tri thức (RAG)", icon: Database },
  { id: "upload", label: "Nạp tri thức từ Tài liệu (AI)", icon: FileText },
]

export default function KnowledgeList() {
  const [activeTab, setActiveTab] = React.useState("rag")
  const [refreshTrigger, setRefreshTrigger] = React.useState(0)
  
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

  const handleRefresh = () => setRefreshTrigger(prev => prev + 1)

  const handleEdit = (doc: KnowledgeDocument) => {
    setSelectedDoc(doc.id ? doc : undefined)
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

  const onConfirmDelete = async () => {
    const ids = confirmDelete.ids
    if (!ids || ids.length === 0) return

    try {
      await knowledgeService.deleteDocuments(ids)
      toast.success(ids.length > 1 ? `Đã xóa ${ids.length} tài liệu thành công!` : "Đã xóa tài liệu thành công!")
      handleRefresh()
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi xóa tài liệu.")
    } finally {
      setConfirmDelete(prev => ({ ...prev, isOpen: false }))
    }
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Tab Navigation */}
      <div className="flex p-1.5 bg-slate-100 rounded-3xl w-fit border border-slate-200 shadow-inner">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2.5 px-6 py-3 rounded-[1.25rem] text-xs font-bold uppercase tracking-widest transition-all relative",
              activeTab === tab.id ? "text-sky-700 shadow-sm" : "text-slate-400 hover:text-slate-600"
            )}
          >
            {activeTab === tab.id && (
              <motion.div layoutId="knowledge-tab" className="absolute inset-0 bg-white rounded-[1.25rem] border border-white/50 shadow-md" />
            )}
            <tab.icon size={16} className="relative z-10" />
            <span className="relative z-10">{tab.label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "rag" ? (
          <motion.div
            key="rag"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <KnowledgeRagTab 
              onEdit={handleEdit}
              onDelete={handleDeleteOne}
              refreshTrigger={refreshTrigger}
            />
          </motion.div>
        ) : (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <SourceDocumentTab />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form Modal */}
      <KnowledgeFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleRefresh}
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

import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import { 
  Zap, 
  Layers, 
  Brain, 
  Search, 
  Plus, 
  Sparkles,
  Filter,
  Trash2,
  RefreshCcw
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { DataTable } from "@/components/DataTable/DataTable"
import { quizColumns } from "./components/quiz-columns"
import { flashcardColumns } from "./components/flashcard-columns"
import { mindmapColumns } from "./components/mindmap-columns"
import { adminRevisionService } from "./services/revision.service"
import { ConfirmModal } from "@/components/ui/ConfirmModal"
import { toast } from "sonner"
import AiDraftModal from "./components/AiDraftModal"
import QuizFormModal from "./components/QuizFormModal"
import FlashcardFormModal from "./components/FlashcardFormModal"
import MindmapFormModal from "./components/MindmapFormModal"

const TABS = [
  { id: "quiz", label: "Câu hỏi (Quiz)", icon: Zap, color: "text-sky-600", bg: "bg-sky-50" },
  { id: "flashcard", label: "Flashcards", icon: Layers, color: "text-orange-600", bg: "bg-orange-50" },
  { id: "mindmap", label: "Sơ đồ tư duy", icon: Brain, color: "text-indigo-600", bg: "bg-indigo-50" },
]

export default function RevisionIndex() {
  const [activeTab, setActiveTab] = React.useState("quiz")
  const [search, setSearch] = React.useState("")
  const [grade, setGrade] = React.useState<string>("all")
  const [data, setData] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [rowSelection, setRowSelection] = React.useState({})
  
  // Modal states
  const [isAiModalOpen, setIsAiModalOpen] = React.useState(false)
  const [isFormModalOpen, setIsFormModalOpen] = React.useState(false)
  const [selectedItem, setSelectedItem] = React.useState<any>(undefined)
  const [confirmDelete, setConfirmDelete] = React.useState<{ isOpen: boolean; ids: string[] }>({ isOpen: false, ids: [] })

  const fetchData = React.useCallback(async () => {
    setLoading(true)
    try {
      const params = {
        grade: grade === "all" ? undefined : Number(grade),
        topic: search || undefined
      }

      let response: any
      if (activeTab === "quiz") response = await adminRevisionService.getQuestions(params)
      else if (activeTab === "flashcard") response = await adminRevisionService.getFlashcards(params)
      else if (activeTab === "mindmap") response = await adminRevisionService.getMindmaps(params)

      if (activeTab === "quiz") setData(response.data.questions)
      else if (activeTab === "flashcard") setData(response.data.decks)
      else if (activeTab === "mindmap") setData(response.data.mindmaps)

    } catch (err: any) {
      toast.error(err.message || "Không thể tải dữ liệu")
    } finally {
      setLoading(false)
    }
  }, [activeTab, grade, search])

  React.useEffect(() => {
    const timer = setTimeout(() => {
        fetchData()
    }, 300)
    return () => clearTimeout(timer)
  }, [fetchData])

  const handleAddManual = () => {
    setSelectedItem(undefined)
    setIsFormModalOpen(true)
  }

  const handleEdit = (item: any) => {
    setSelectedItem(item)
    setIsFormModalOpen(true)
  }

  const handleDeleteOne = (id: string) => {
    setConfirmDelete({ isOpen: true, ids: [id] })
  }

  const handleDeleteSelected = () => {
    const ids = Object.keys(rowSelection).map(idx => data[parseInt(idx)].id)
    if (ids.length > 0) {
        setConfirmDelete({ isOpen: true, ids })
    }
  }

  const onConfirmDelete = async () => {
    try {
        if (activeTab === "quiz") await adminRevisionService.deleteQuestions(confirmDelete.ids)
        else if (activeTab === "flashcard") await adminRevisionService.deleteFlashcards(confirmDelete.ids)
        else if (activeTab === "mindmap") await adminRevisionService.deleteMindmaps(confirmDelete.ids)
        
        toast.success(`Đã xóa thành công ${confirmDelete.ids.length} mục.`)
        setRowSelection({})
        fetchData()
    } catch (err: any) {
        toast.error(err.message || "Lỗi khi xóa dữ liệu.")
    }
  }

  const getColumns = () => {
    if (activeTab === "quiz") return quizColumns
    if (activeTab === "flashcard") return flashcardColumns
    return mindmapColumns
  }

  const selectedCount = Object.keys(rowSelection).length

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex p-1.5 bg-slate-100 rounded-[2rem] w-fit border border-slate-200 shadow-inner">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
                setActiveTab(tab.id)
                setRowSelection({})
                setData([])
            }}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all relative",
              activeTab === tab.id 
                ? "text-slate-900" 
                : "text-slate-400 hover:text-slate-600"
            )}
          >
            {activeTab === tab.id && (
              <motion.div 
                layoutId="active-tab"
                className="absolute inset-0 bg-white rounded-full shadow-md"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
            <tab.icon size={16} className={cn("relative z-10", activeTab === tab.id ? tab.color : "")} />
            <span className="relative z-10">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Header Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Tìm kiếm chủ đề/nội dung..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-11 bg-white border-slate-200 rounded-2xl focus:ring-sky-500/20"
            />
          </div>

          <div className="flex items-center gap-2 bg-white border border-slate-200 p-1.5 rounded-2xl">
             <Filter size={14} className="ml-2 text-slate-400" />
             <select 
               value={grade}
               onChange={(e) => setGrade(e.target.value)}
               className="bg-transparent border-none outline-none text-xs font-bold text-slate-600 px-2 pr-4 appearance-none cursor-pointer"
             >
                <option value="all">Tất cả Khối</option>
                <option value="6">Lớp 6</option>
                <option value="7">Lớp 7</option>
                <option value="8">Lớp 8</option>
                <option value="9">Lớp 9</option>
             </select>
          </div>

          {selectedCount > 0 && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 bg-slate-100 p-2 pl-4 rounded-2xl border border-slate-200"
            >
              <span className="text-xs font-bold text-slate-600">Đã chọn <span className="text-slate-900">{selectedCount}</span></span>
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
          <Button 
            onClick={() => setIsAiModalOpen(true)}
            className="h-11 px-6 gap-2 rounded-2xl bg-gradient-to-r from-sky-600 to-indigo-600 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-sky-200 hover:scale-105 transition-all"
          >
            <Sparkles size={18} />
            Nhờ AI Soạn thảo
          </Button>
          <div className="h-6 w-px bg-slate-200 mx-1" />
          <Button 
            onClick={handleAddManual}
            variant="outline"
            className="h-11 px-6 gap-2 rounded-2xl border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-all"
          >
            <Plus size={18} />
            Thêm thủ công
          </Button>
        </div>
      </div>

      {/* DataTable */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden no-pagination">
        <DataTable
          columns={getColumns()}
          data={data}
          loading={loading}
          totalCount={data.length}
          meta={{
            onEdit: handleEdit,
            onDelete: handleDeleteOne,
          }}
          onRowSelectionChange={setRowSelection}
          state={{ rowSelection }}
        />
      </div>

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
        onSuccess={fetchData}
      />

      {/* Manual Form Modals */}
      {activeTab === "quiz" && (
        <QuizFormModal 
          isOpen={isFormModalOpen}
          onClose={() => setIsFormModalOpen(false)}
          onSuccess={fetchData}
          quiz={selectedItem}
        />
      )}
      {activeTab === "flashcard" && (
        <FlashcardFormModal 
          isOpen={isFormModalOpen}
          onClose={() => setIsFormModalOpen(false)}
          onSuccess={fetchData}
          deck={selectedItem}
        />
      )}
      {activeTab === "mindmap" && (
        <MindmapFormModal 
          isOpen={isFormModalOpen}
          onClose={() => setIsFormModalOpen(false)}
          onSuccess={fetchData}
          mindmap={selectedItem}
        />
      )}
    </div>
  )
}

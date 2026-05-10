import * as React from "react"
import { motion } from "motion/react"
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
import { quizColumns } from "./quiz-columns"
import { flashcardColumns } from "./flashcard-columns"
import { mindmapColumns } from "./mindmap-columns"
import { adminRevisionService } from "../services/revision.service"
import { PaginationState } from "@tanstack/react-table"
import { toast } from "sonner"

interface RevisionListTabProps {
  activeTab: string
  setActiveTab: (tab: string) => void
  onEdit: (item: any) => void
  onDelete: (ids: string[]) => void
  onAiDraft: () => void
  onAddManual: () => void
  refreshTrigger?: number
}

const TABS = [
  { id: "quiz", label: "Câu hỏi (Quiz)", icon: Zap, color: "text-sky-600", bg: "bg-sky-50" },
  { id: "flashcard", label: "Flashcards", icon: Layers, color: "text-orange-600", bg: "bg-orange-50" },
  { id: "mindmap", label: "Sơ đồ tư duy", icon: Brain, color: "text-indigo-600", bg: "bg-indigo-50" },
]

export function RevisionListTab({ 
  activeTab, 
  setActiveTab, 
  onEdit, 
  onDelete, 
  onAiDraft, 
  onAddManual,
  refreshTrigger
}: RevisionListTabProps) {
  const [search, setSearch] = React.useState("")
  const [grade, setGrade] = React.useState<string>("all")
  const [data, setData] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [rowSelection, setRowSelection] = React.useState({})
  
  // Pagination state
  const [{ pageIndex, pageSize }, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })
  const [totalCount, setTotalCount] = React.useState(0)
  const [pageCount, setPageCount] = React.useState(0)

  const fetchData = React.useCallback(async () => {
    setLoading(true)
    try {
      const params = {
        page: pageIndex + 1,
        limit: pageSize,
        grade: grade === "all" ? undefined : Number(grade),
        topic: search || undefined
      }

      let response: any
      if (activeTab === "quiz") response = await adminRevisionService.getQuestions(params)
      else if (activeTab === "flashcard") response = await adminRevisionService.getFlashcards(params)
      else if (activeTab === "mindmap") response = await adminRevisionService.getMindmaps(params)

      if (activeTab === "quiz") {
        setData(response.data.questions)
        setTotalCount(response.data.pagination.total)
        setPageCount(response.data.pagination.totalPages)
      } else if (activeTab === "flashcard") {
        setData(response.data.decks)
        setTotalCount(response.data.pagination.total)
        setPageCount(response.data.pagination.totalPages)
      } else if (activeTab === "mindmap") {
        setData(response.data.mindmaps)
        setTotalCount(response.data.pagination.total)
        setPageCount(response.data.pagination.totalPages)
      }

    } catch (err: any) {
      toast.error(err.message || "Không thể tải dữ liệu")
    } finally {
      setLoading(false)
    }
  }, [activeTab, grade, search, pageIndex, pageSize, refreshTrigger])

  React.useEffect(() => {
    const timer = setTimeout(() => {
        fetchData()
    }, 300)
    return () => clearTimeout(timer)
  }, [fetchData])

  const handleDeleteSelected = () => {
    const ids = Object.keys(rowSelection).map(idx => data[parseInt(idx)].id)
    if (ids.length > 0) {
        onDelete(ids)
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
      <div className="overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex p-1 bg-slate-100 rounded-2xl sm:rounded-[2rem] w-max sm:w-fit border border-slate-200 shadow-inner">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                  setActiveTab(tab.id)
                  setRowSelection({})
                  setData([])
                  setPagination({ pageIndex: 0, pageSize: 10 })
              }}
              className={cn(
                "flex items-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-all relative whitespace-nowrap",
                activeTab === tab.id 
                  ? "text-slate-900" 
                  : "text-slate-400 hover:text-slate-600"
              )}
            >
              {activeTab === tab.id && (
                <motion.div 
                  layoutId="active-tab"
                  className="absolute inset-0 bg-white rounded-xl sm:rounded-full shadow-md"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <tab.icon size={14} className={cn("relative z-10", activeTab === tab.id ? tab.color : "")} />
              <span className="relative z-10">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
             <h3 className="text-lg font-bold text-slate-800 uppercase tracking-tight sm:hidden">
               {TABS.find(t => t.id === activeTab)?.label}
             </h3>
             <div className="flex items-center gap-2 ml-auto">
              <Button 
                onClick={onAiDraft}
                className="h-10 px-4 gap-2 rounded-xl sm:rounded-2xl bg-gradient-to-r from-sky-600 to-indigo-600 text-white font-bold uppercase tracking-widest text-[9px] sm:text-[10px] shadow-lg shadow-sky-200 hover:scale-105 transition-all"
              >
                <Sparkles size={16} />
                <span className="hidden xs:inline">AI Soạn thảo</span>
                <span className="xs:hidden">AI</span>
              </Button>
              <Button 
                onClick={onAddManual}
                variant="outline"
                className="h-10 px-4 gap-2 rounded-xl sm:rounded-2xl border-slate-200 font-bold text-slate-600 text-[10px] sm:text-xs hover:bg-slate-50 transition-all"
              >
                <Plus size={16} />
                <span className="hidden xs:inline">Thêm thủ công</span>
                <span className="xs:hidden">Thêm</span>
              </Button>
             </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full sm:flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Tìm kiếm chủ đề..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-10 bg-white border-slate-200 rounded-xl sm:rounded-2xl focus:ring-sky-500/20 text-sm"
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="flex-1 sm:flex-none flex items-center gap-2 bg-white border border-slate-200 p-1 rounded-xl sm:rounded-2xl h-10">
                <Filter size={14} className="ml-2 text-slate-400" />
                <select 
                  value={grade}
                  onChange={(e) => {
                    setGrade(e.target.value)
                    setPagination({ pageIndex: 0, pageSize: 10 })
                  }}
                  className="flex-1 sm:flex-none bg-transparent border-none outline-none text-[10px] sm:text-xs font-bold text-slate-600 px-2 pr-4 appearance-none cursor-pointer"
                >
                    <option value="all">Tất cả Khối</option>
                    <option value="6">Lớp 6</option>
                    <option value="7">Lớp 7</option>
                    <option value="8">Lớp 8</option>
                    <option value="9">Lớp 9</option>
                </select>
              </div>
              
              <Button variant="outline" onClick={fetchData} className="h-10 w-10 p-0 rounded-xl border-slate-200 shrink-0">
                <RefreshCcw size={16} className={loading ? "animate-spin" : ""} />
              </Button>
            </div>

            {selectedCount > 0 && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 bg-red-50 p-1 pl-3 rounded-xl border border-red-100 w-full sm:w-auto"
              >
                <span className="text-[10px] font-bold text-red-600">Đã chọn {selectedCount}</span>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleDeleteSelected}
                  className="h-8 px-3 text-[10px] font-bold text-red-600 hover:bg-white rounded-lg gap-2 ml-auto"
                >
                  <Trash2 size={14} /> Xóa
                </Button>
              </motion.div>
            )}
          </div>
        </div>

        {/* DataTable */}
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
          <DataTable
            columns={getColumns()}
            data={data}
            loading={loading}
            totalCount={totalCount}
            pageCount={pageCount}
            pagination={{ pageIndex, pageSize }}
            onPaginationChange={setPagination}
            meta={{
              onEdit,
              onDelete: (id: string) => onDelete([id]),
            }}
            onRowSelectionChange={setRowSelection}
            state={{ rowSelection }}
          />
        </div>
      </div>
    </div>
  )
}

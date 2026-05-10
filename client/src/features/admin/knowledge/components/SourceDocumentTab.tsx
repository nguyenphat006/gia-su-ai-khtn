import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import { FileText, UploadCloud, RefreshCw, Eye, Search, Filter, ChevronLeft, ChevronRight, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { apiClient } from "@/lib/apiClient"
import { cn } from "@/lib/utils"
import { ResponsiveModal } from "@/components/ui/ResponsiveModal"
import FormattedContent from "@/components/ui/FormattedContent"

export function SourceDocumentTab() {
  const [documents, setDocuments] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [file, setFile] = React.useState<File | null>(null)
  const [grade, setGrade] = React.useState("8")
  const [topic, setTopic] = React.useState("")
  const [uploading, setUploading] = React.useState(false)

  // Filtering & Pagination state
  const [search, setSearch] = React.useState("")
  const [gradeFilter, setGradeFilter] = React.useState<string>("all")
  const [pagination, setPagination] = React.useState({
    page: 1,
    limit: 5,
    totalPages: 1,
    total: 0
  })

  // Detail View state
  const [viewingDoc, setViewingDoc] = React.useState<any | null>(null)
  const [viewingContent, setViewingContent] = React.useState<string>("")
  const [loadingContent, setLoadingContent] = React.useState(false)

  const fetchDocuments = React.useCallback(async () => {
    try {
      const query = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      })
      if (search) query.append("search", search)
      if (gradeFilter !== "all") query.append("grade", gradeFilter)

      const res = await apiClient<any>(`/api/documents?${query.toString()}`)
      setDocuments(res.data.documents || [])
      setPagination(prev => ({
        ...prev,
        totalPages: res.data.pagination.totalPages,
        total: res.data.pagination.total
      }))
    } catch (e: any) {
      toast.error(e.message || "Lỗi tải danh sách tài liệu")
    } finally {
      setLoading(false)
    }
  }, [pagination.page, pagination.limit, search, gradeFilter])

  React.useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  // Tự động làm mới tiến độ cho các doc đang xử lý
  React.useEffect(() => {
    const hasProcessing = documents.some(d => d.status === "PROCESSING")
    if (!hasProcessing) return

    const interval = setInterval(fetchDocuments, 5000)
    return () => clearInterval(interval)
  }, [documents, fetchDocuments])

  const handleUpload = async () => {
    if (!file) return toast.error("Vui lòng chọn file!")
    
    setUploading(true)
    const formData = new FormData()
    formData.append("file", file)
    formData.append("grade", grade)
    formData.append("topic", topic)

    try {
      const data = await apiClient<any>("/api/documents/upload", {
        method: "POST",
        body: formData
      })
      
      toast.success(data.message)
      setFile(null)
      setTopic("")
      setPagination(prev => ({ ...prev, page: 1 }))
      fetchDocuments()
    } catch (e: any) {
      toast.error(e.message || "Upload thất bại")
    } finally {
      setUploading(false)
    }
  }

  const handleViewContent = async (doc: any) => {
    setViewingDoc(doc)
    setLoadingContent(true)
    try {
      const res = await apiClient<any>(`/api/documents/${doc.id}/detail`)
      setViewingContent(res.data.document.rawText || "Không có nội dung văn bản.")
    } catch (e: any) {
      toast.error("Không thể tải nội dung tài liệu")
    } finally {
      setLoadingContent(false)
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Upload Zone */}
      <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center">
            <UploadCloud className="text-emerald-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold uppercase tracking-tight text-slate-800">Nạp Tri thức Bài học (AI Ingestion)</h3>
            <p className="text-slate-500 text-sm">Hệ thống sẽ học toàn bộ kiến thức trong file DOCX/PDF để trả lời học sinh chính xác nhất.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <div className="border-2 border-dashed border-slate-200 rounded-3xl p-10 text-center hover:bg-emerald-50/30 hover:border-emerald-200 transition-all group relative">
              <input 
                type="file" 
                accept=".pdf,.docx,.txt"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                   <FileText className={cn("transition-colors", file ? "text-emerald-600" : "text-slate-300")} size={32} />
                </div>
                <p className="text-sm font-bold text-slate-700">{file ? file.name : "Chọn file tài liệu (.docx, .pdf, .txt)"}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">Dung lượng tối đa 50MB</p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Khối lớp áp dụng</label>
              <select 
                value={grade} onChange={e => setGrade(e.target.value)}
                className="w-full mt-1.5 h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 font-bold focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all outline-none"
              >
                <option value="6">Lớp 6</option>
                <option value="7">Lớp 7</option>
                <option value="8">Lớp 8</option>
                <option value="9">Lớp 9</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Chủ đề bài học</label>
              <Input 
                value={topic} onChange={e => setTopic(e.target.value)}
                placeholder="Ví dụ: Chương 1 - Cơ học"
                className="w-full mt-1.5 h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 font-bold"
              />
            </div>
            <Button 
              onClick={handleUpload} 
              disabled={!file || uploading}
              className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold uppercase tracking-widest gap-2 shadow-lg shadow-emerald-100"
            >
              {uploading ? <RefreshCw className="animate-spin" size={18} /> : <UploadCloud size={18} />}
              Nạp tri thức ngay
            </Button>
          </div>
        </div>
      </div>

      {/* Filter & History */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h4 className="font-bold text-slate-800 flex items-center gap-2 uppercase tracking-tight"><FileText size={18} className="text-emerald-600" /> Kho tài liệu bài học</h4>
            
            <div className="flex items-center gap-3">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <Input 
                        placeholder="Tìm tài liệu..." 
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPagination(p => ({ ...p, page: 1 })) }}
                        className="pl-9 h-10 w-full md:w-64 rounded-xl bg-white border-slate-200"
                    />
                </div>
                <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 h-10">
                    <Filter size={14} className="text-slate-400" />
                    <select 
                        value={gradeFilter}
                        onChange={e => { setGradeFilter(e.target.value); setPagination(p => ({ ...p, page: 1 })) }}
                        className="bg-transparent text-[10px] font-bold uppercase outline-none text-slate-600"
                    >
                        <option value="all">Tất cả khối</option>
                        <option value="6">Khối 6</option>
                        <option value="7">Khối 7</option>
                        <option value="8">Khối 8</option>
                        <option value="9">Khối 9</option>
                    </select>
                </div>
                <Button variant="outline" onClick={fetchDocuments} className="h-10 w-10 p-0 rounded-xl border-slate-200">
                    <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                </Button>
            </div>
        </div>
        
        {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <RefreshCw className="animate-spin text-emerald-500" size={32} />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Đang tải danh sách tài liệu...</p>
            </div>
        ) : (
          <div className="space-y-4">
            {documents.map(doc => (
              <div key={doc.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex-1 min-w-0">
                  <h5 className="font-bold text-lg text-slate-800 truncate">{doc.filename}</h5>
                  <div className="flex flex-wrap gap-3 mt-2">
                    <span className="px-2.5 py-1 bg-slate-50 text-slate-600 rounded-lg text-[10px] font-bold uppercase border border-slate-100">Khối {doc.grade || "N/A"}</span>
                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-bold uppercase border border-emerald-100">{doc.topic || "Tri thức chung"}</span>
                    <span className="px-2.5 py-1 bg-slate-50 text-slate-400 rounded-lg text-[10px] font-bold uppercase border border-slate-100">{new Date(doc.createdAt).toLocaleDateString("vi-VN")}</span>
                  </div>
                </div>

                <div className="w-full md:w-56 text-center">
                  <div className="flex justify-between items-end mb-1.5 px-1">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Tiến độ nạp</span>
                    <span className="text-[10px] font-bold text-emerald-600">{doc.parsedChunks}/{doc.totalChunks} Chunks</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 border border-slate-200/50 p-0.5">
                    <div 
                      className="bg-emerald-500 h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(16,185,129,0.3)]" 
                      style={{ width: `${doc.totalChunks > 0 ? (doc.parsedChunks / doc.totalChunks) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <p className="text-[9px] mt-2 font-bold uppercase tracking-widest text-slate-400">
                    Trạng thái: <span className={cn(
                        doc.status === "COMPLETED" ? "text-emerald-600" : doc.status === "PROCESSING" ? "text-sky-500 animate-pulse" : "text-red-500"
                    )}>
                        {doc.status === "PROCESSING" ? "Đang trích xuất..." : doc.status === "COMPLETED" ? "Hoàn thành" : "Thất bại"}
                    </span>
                  </p>
                </div>

                <div className="flex items-center gap-4 pl-6 md:border-l border-slate-100">
                  <Button 
                    onClick={() => handleViewContent(doc)}
                    className="bg-slate-900 text-white hover:bg-slate-800 font-bold rounded-xl h-11 px-6 gap-2 text-xs uppercase tracking-widest"
                  >
                    <Eye size={16} /> Xem nội dung
                  </Button>
                </div>
              </div>
            ))}
            
            {documents.length === 0 && (
              <div className="text-center py-20 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <FileText className="text-slate-300" size={32} />
                </div>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Kho tài liệu trống</p>
                <p className="text-slate-400 text-[10px] font-medium mt-1">Hãy tải lên tài liệu Bài học để xây dựng tri thức.</p>
              </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-8">
                    <Button 
                        variant="outline" size="sm" 
                        disabled={pagination.page === 1}
                        onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                        className="rounded-xl border-slate-200 font-bold"
                    >
                        <ChevronLeft size={16} />
                    </Button>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Trang {pagination.page} / {pagination.totalPages}</span>
                    <Button 
                        variant="outline" size="sm" 
                        disabled={pagination.page === pagination.totalPages}
                        onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                        className="rounded-xl border-slate-200 font-bold"
                    >
                        <ChevronRight size={16} />
                    </Button>
                </div>
            )}
          </div>
        )}
      </div>

      {/* Content Viewer Modal */}
      <ResponsiveModal
        isOpen={!!viewingDoc}
        onOpenChange={(open) => !open && setViewingDoc(null)}
        title={viewingDoc?.filename || "Nội dung tài liệu"}
        maxWidth="4xl"
      >
        <div className="space-y-4">
           <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex gap-4">
                 <span className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-bold uppercase text-slate-500">Khối {viewingDoc?.grade}</span>
                 <span className="px-2 py-1 bg-emerald-50 border border-emerald-100 rounded-lg text-[10px] font-bold uppercase text-emerald-600">{viewingDoc?.topic}</span>
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Văn bản đã được AI trích xuất</p>
           </div>

           <div className="bg-white border border-slate-100 rounded-2xl p-6 min-h-[400px] max-h-[60vh] overflow-y-auto custom-scrollbar shadow-inner relative">
              {loadingContent ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm z-10 rounded-2xl">
                      <RefreshCw className="animate-spin text-emerald-500 mb-4" size={32} />
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Đang tải dữ liệu văn bản...</p>
                  </div>
              ) : (
                  <div className="prose prose-slate max-w-none">
                      <FormattedContent content={viewingContent} />
                  </div>
              )}
           </div>

           <div className="flex justify-end pt-2">
              <Button onClick={() => setViewingDoc(null)} className="rounded-xl bg-slate-900 text-white font-bold h-11 px-8">Đóng cửa sổ</Button>
           </div>
        </div>
      </ResponsiveModal>
    </div>
  )
}

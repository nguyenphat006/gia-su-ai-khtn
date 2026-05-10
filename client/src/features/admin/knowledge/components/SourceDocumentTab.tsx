import * as React from "react"
import { motion } from "motion/react"
import { FileText, UploadCloud, RefreshCw, CheckCircle, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { apiClient } from "@/lib/apiClient"
import { cn } from "@/lib/utils"

export function SourceDocumentTab() {
  const [documents, setDocuments] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [file, setFile] = React.useState<File | null>(null)
  const [grade, setGrade] = React.useState("8")
  const [topic, setTopic] = React.useState("")
  const [uploading, setUploading] = React.useState(false)

  const fetchDocuments = async () => {
    try {
      const res = await apiClient<any>("/api/documents")
      setDocuments(res.data.documents || [])
    } catch (e: any) {
      toast.error(e.message || "Lỗi tải danh sách tài liệu")
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    fetchDocuments()
    // Tự động làm mới mỗi 10 giây để theo dõi tiến độ
    const interval = setInterval(fetchDocuments, 10000)
    return () => clearInterval(interval)
  }, [])

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
      fetchDocuments()
    } catch (e: any) {
      toast.error(e.message || "Upload thất bại")
    } finally {
      setUploading(false)
    }
  }

  const handleReview = async (id: string, action: "APPROVE_ALL" | "DELETE_ALL") => {
    if (!window.confirm(action === "APPROVE_ALL" ? "Bạn muốn phê duyệt TẤT CẢ câu hỏi đang pending của tài liệu này?" : "Bạn muốn HỦY TẤT CẢ câu hỏi pending?")) return

    try {
      await apiClient(`/api/documents/${id}/review`, {
        method: "POST",
        body: JSON.stringify({ action })
      })
      toast.success("Thao tác thành công")
      fetchDocuments()
    } catch (e: any) {
      toast.error(e.message || "Thao tác thất bại")
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Upload Zone */}
      <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center">
            <UploadCloud className="text-emerald-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold uppercase tracking-tight text-slate-800">Nạp Tri thức từ Tài liệu (AI)</h3>
            <p className="text-slate-500 text-sm">Upload file PDF/Word, AI sẽ tự động đọc, phân tích tri thức và sinh câu hỏi ôn tập tương ứng.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <div className="border-2 border-dashed border-slate-200 rounded-3xl p-10 text-center hover:bg-emerald-50/30 hover:border-emerald-200 transition-all group">
              <Input 
                type="file" 
                accept=".pdf,.docx,.txt"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="mx-auto max-w-sm mb-4 bg-white"
              />
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest group-hover:text-emerald-600 transition-colors">Hỗ trợ định dạng: PDF, DOCX, TXT. Tối đa 50MB.</p>
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
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Chủ đề Tri thức</label>
              <Input 
                value={topic} onChange={e => setTopic(e.target.value)}
                placeholder="Ví dụ: Quang hợp ở thực vật"
                className="w-full mt-1.5 h-11 bg-slate-50 border-slate-200 rounded-xl px-4 font-bold"
              />
            </div>
            <Button 
              onClick={handleUpload} 
              disabled={!file || uploading}
              className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold uppercase tracking-widest gap-2 shadow-lg shadow-emerald-100"
            >
              {uploading ? <RefreshCw className="animate-spin" size={18} /> : <UploadCloud size={18} />}
              Bắt đầu Phân tích
            </Button>
          </div>
        </div>
      </div>

      {/* History List */}
      <div>
        <div className="flex items-center justify-between mb-6">
            <h4 className="font-bold text-slate-800 flex items-center gap-2 uppercase tracking-tight"><FileText size={18} className="text-emerald-600" /> Tài liệu đã nạp tri thức</h4>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Tự động cập nhật mỗi 10 giây</p>
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
                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Tiến độ AI</span>
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
                  <div className="text-center min-w-[80px]">
                    <p className="text-2xl font-black text-sky-600 leading-none">{doc._count.questions}</p>
                    <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-1">Câu hỏi sinh ra</p>
                  </div>
                  
                  <div className="flex flex-col gap-2 shrink-0">
                    <Button 
                      size="sm" 
                      onClick={() => handleReview(doc.id, "APPROVE_ALL")}
                      disabled={doc._count.questions === 0}
                      className="bg-sky-600 text-white hover:bg-sky-700 font-bold rounded-xl h-9 text-[10px] uppercase tracking-widest px-4"
                    >
                      Duyệt tất cả
                    </Button>
                    <Button 
                      size="sm" variant="ghost" 
                      onClick={() => handleReview(doc.id, "DELETE_ALL")}
                      disabled={doc._count.questions === 0}
                      className="text-red-500 hover:bg-red-50 font-bold rounded-xl h-9 text-[10px] uppercase tracking-widest px-4"
                    >
                      Loại bỏ
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            
            {documents.length === 0 && (
              <div className="text-center py-20 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <FileText className="text-slate-300" size={32} />
                </div>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Kho tài liệu trống</p>
                <p className="text-slate-400 text-[10px] font-medium mt-1">Hãy tải lên tài liệu PDF để bắt đầu xây dựng tri thức.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

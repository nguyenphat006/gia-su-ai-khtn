import * as React from "react"
import { motion } from "motion/react"
import { FileText, UploadCloud, RefreshCw, CheckCircle, Trash2, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { apiClient } from "@/lib/apiClient"

export default function DocumentUploadTab() {
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
    <div className="space-y-8">
      {/* Upload Zone */}
      <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center">
            <UploadCloud className="text-emerald-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Nhập liệu từ Sách / Tài liệu</h3>
            <p className="text-slate-500 text-sm">Upload file PDF hoặc Word, AI sẽ tự động đọc, phân tích và sinh ra hàng trăm câu hỏi.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center hover:bg-slate-50 transition-all">
              <Input 
                type="file" 
                accept=".pdf,.docx,.txt"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="mx-auto max-w-sm mb-4"
              />
              <p className="text-xs text-slate-400 font-bold">Hỗ trợ định dạng: PDF, DOCX, TXT. Tối đa 50MB.</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Khối lớp</label>
              <select 
                value={grade} onChange={e => setGrade(e.target.value)}
                className="w-full mt-1 h-11 bg-slate-50 border-slate-200 rounded-xl px-4 font-bold"
              >
                <option value="6">Lớp 6</option>
                <option value="7">Lớp 7</option>
                <option value="8">Lớp 8</option>
                <option value="9">Lớp 9</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Chủ đề (Tùy chọn)</label>
              <Input 
                value={topic} onChange={e => setTopic(e.target.value)}
                placeholder="Ví dụ: Ôn tập chương 1"
                className="w-full mt-1 h-11 bg-slate-50 border-slate-200 rounded-xl px-4"
              />
            </div>
            <Button 
              onClick={handleUpload} 
              disabled={!file || uploading}
              className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold uppercase tracking-widest gap-2"
            >
              {uploading ? <RefreshCw className="animate-spin" size={18} /> : <UploadCloud size={18} />}
              Bắt đầu Phân tích
            </Button>
          </div>
        </div>
      </div>

      {/* History List */}
      <div>
        <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><FileText size={18} /> Lịch sử Phân tích Tài liệu</h4>
        
        {loading ? <p className="text-center text-slate-400 py-10">Đang tải...</p> : (
          <div className="space-y-4">
            {documents.map(doc => (
              <div key={doc.id} className="bg-white p-6 rounded-2xl border border-slate-100 flex items-center justify-between gap-6 shadow-sm">
                <div className="flex-1">
                  <h5 className="font-bold text-lg text-slate-800">{doc.filename}</h5>
                  <div className="flex gap-4 mt-2 text-sm text-slate-500">
                    <span>Khối: {doc.grade || "N/A"}</span>
                    <span>Chủ đề: {doc.topic || "N/A"}</span>
                    <span>Ngày: {new Date(doc.createdAt).toLocaleDateString("vi-VN")}</span>
                  </div>
                </div>

                <div className="w-48 text-center">
                  <div className="text-xs font-bold mb-1 uppercase tracking-widest text-slate-500">
                    Tiến độ AI ({doc.parsedChunks}/{doc.totalChunks})
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5">
                    <div 
                      className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500" 
                      style={{ width: `${doc.totalChunks > 0 ? (doc.parsedChunks / doc.totalChunks) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <p className="text-xs mt-1 font-bold text-emerald-600">
                    {doc.status === "PROCESSING" ? "Đang xử lý ngầm..." : doc.status === "COMPLETED" ? "Hoàn thành" : "Lỗi"}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-center px-4 border-l border-slate-100">
                    <p className="text-2xl font-bold text-sky-600">{doc._count.questions}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Câu hỏi Pending</p>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <Button 
                      size="sm" 
                      onClick={() => handleReview(doc.id, "APPROVE_ALL")}
                      disabled={doc._count.questions === 0}
                      className="bg-sky-50 text-sky-600 hover:bg-sky-100 font-bold"
                    >
                      <CheckCircle size={14} className="mr-2" /> Duyệt tất cả
                    </Button>
                    <Button 
                      size="sm" variant="ghost" 
                      onClick={() => handleReview(doc.id, "DELETE_ALL")}
                      disabled={doc._count.questions === 0}
                      className="text-red-500 hover:bg-red-50 font-bold"
                    >
                      <Trash2 size={14} className="mr-2" /> Xóa
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            
            {documents.length === 0 && (
              <div className="text-center py-10 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                <p className="text-slate-500 font-bold">Chưa có tài liệu nào được tải lên.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

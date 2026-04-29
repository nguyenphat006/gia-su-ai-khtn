import { useEffect, useState } from "react";
import { Loader2, Trash2, Plus, FileText, Upload } from "lucide-react";
import { adminService } from "../service";

export default function KnowledgeBaseTab() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  
  // Form add new
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchDocs = async () => {
    setIsLoading(true);
    try {
      const data = await adminService.getDocuments();
      setDocuments(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Xoá tài liệu này?")) return;
    try {
      await adminService.deleteDocument(id);
      fetchDocs();
    } catch (error) {
      alert("Lỗi khi xoá");
    }
  };

  const handleAdd = async () => {
    if (!title || !content) return alert("Vui lòng điền đủ Tiêu đề và Nội dung");
    setIsSubmitting(true);
    try {
      await adminService.createDocument(title, content, ["khtn"]);
      setIsAdding(false);
      setTitle("");
      setContent("");
      fetchDocs();
    } catch (error) {
      alert("Lỗi khi thêm tài liệu");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-sky-500" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Kho Tri Thức (RAG Data)</h2>
          <p className="text-sm text-slate-500">Quản lý các tài liệu, bài học được nạp vào để AI làm cơ sở trả lời.</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="bg-sky-100 text-sky-700 hover:bg-sky-200 px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-colors"
        >
          {isAdding ? "Hủy" : <><Plus size={18} /> Thêm tài liệu mới</>}
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-2xl border border-sky-200 shadow-sm space-y-4 animate-in fade-in slide-in-from-top-4">
          <input 
            type="text" 
            placeholder="Tiêu đề tài liệu (VD: Bài 1: Năng lượng)" 
            className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:border-sky-500 font-bold"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea 
            placeholder="Dán nội dung tài liệu (văn bản thuần) vào đây..." 
            className="w-full h-[200px] p-4 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-sky-500 text-sm resize-y custom-scrollbar"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <div className="flex justify-end">
            <button 
              onClick={handleAdd}
              disabled={isSubmitting}
              className="bg-sky-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-sky-700 disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />}
              Đưa vào Kho Tri Thức
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
            <tr>
              <th className="py-3 px-6">Tiêu đề</th>
              <th className="py-3 px-6">Trạng thái</th>
              <th className="py-3 px-6">Ngày thêm</th>
              <th className="py-3 px-6 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {documents.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-10 text-center text-slate-400">
                  Chưa có tài liệu nào.
                </td>
              </tr>
            ) : documents.map((doc) => (
              <tr key={doc.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                <td className="py-3 px-6 font-bold text-slate-800 flex items-center gap-2">
                  <FileText size={16} className="text-sky-500" />
                  {doc.title}
                </td>
                <td className="py-3 px-6">
                  {doc.isActive ? (
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-black uppercase">Active</span>
                  ) : (
                    <span className="px-2 py-1 bg-slate-100 text-slate-500 rounded-full text-xs font-black uppercase">Hidden</span>
                  )}
                </td>
                <td className="py-3 px-6 text-slate-500">
                  {new Date(doc.createdAt).toLocaleDateString("vi-VN")}
                </td>
                <td className="py-3 px-6 text-right">
                  <button 
                    onClick={() => handleDelete(doc.id)}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Xóa tài liệu"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { motion } from "motion/react";
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, Database } from "lucide-react";

interface KnowledgeManagerProps {
  isUploading: boolean;
  uploadStatus: "idle" | "success" | "error";
  documents: any[];
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  clearDatabase: () => void;
}

export function KnowledgeManager({ isUploading, uploadStatus, documents, handleFileUpload, clearDatabase }: KnowledgeManagerProps) {
  return (
    <div className="bg-white rounded-3xl p-8 border border-sky-100 card-shadow">
       <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-sky-50 rounded-2xl flex items-center justify-center text-sky-600 font-bold border border-sky-100">
             <Upload size={24} />
          </div>
          <h3 className="font-display font-bold text-sky-900 text-xl tracking-tight">Quản lý tri thức AI (RAG)</h3>
       </div>

       <p className="text-sm text-black mb-8 leading-relaxed font-bold">
          Tải lên tài liệu để bồi dưỡng kiến thức cho Gia sư AI. Hệ thống sẽ ưu tiên sử dụng dữ liệu này để trả lời học sinh.
       </p>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="relative group">
             <input 
               type="file" 
               onChange={handleFileUpload}
               accept=".pdf,.docx,.txt"
               className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
               disabled={isUploading}
             />
             <div className="border-2 border-dashed border-sky-100/50 rounded-3xl p-12 flex flex-col items-center justify-center gap-4 group-hover:bg-sky-50/50 group-hover:border-sky-400/50 transition-all cursor-pointer bg-slate-50/30">
                {isUploading ? (
                  <Loader2 className="animate-spin text-sky-500" size={40} />
                ) : (
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-sky-600 shadow-sm border border-sky-50">
                     <FileText size={32} />
                  </div>
                )}
                <div className="text-center">
                  <p className="font-bold text-sky-900">
                    {isUploading ? "Đang nạp tri thức..." : "Kéo thả giáo án vào đây"}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-2 uppercase font-bold tracking-widest">Hỗ trợ PDF, Word, TXT</p>
                </div>
             </div>
             
             {uploadStatus === "success" && (
               <div className="mt-4 flex items-center gap-2 text-sky-600 font-bold text-xs bg-sky-50 p-4 rounded-2xl border border-sky-100">
                  <CheckCircle size={16} /> Tài liệu đã được nạp thành công!
               </div>
             )}
             {uploadStatus === "error" && (
               <div className="mt-4 flex items-center gap-2 text-red-500 font-bold text-xs bg-red-50 p-4 rounded-2xl border border-red-100">
                  <AlertCircle size={16} /> Có lỗi khi xử lý tài liệu.
               </div>
             )}
          </div>

          <div className="flex flex-col gap-4">
             <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 flex-1 flex flex-col overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                   <div className="flex items-center gap-2 text-black font-black text-xs uppercase tracking-wider">
                      <Database size={14} />
                      Tri thức ({documents.length})
                   </div>
                   <button 
                     onClick={clearDatabase}
                     className="text-[10px] font-bold text-red-500 hover:bg-red-50 px-3 py-1 rounded-lg transition-all border border-red-100"
                   >
                      Xóa tất cả
                   </button>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 mt-4">
                   <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                      {documents.map((doc: any) => (
                        <motion.div 
                          whileHover={{ y: -5, scale: 1.02 }}
                          key={doc.id} 
                          className="bg-white p-5 rounded-3xl border border-sky-50 flex flex-col items-center text-center gap-3 shadow-sm hover:shadow-xl hover:border-sky-300 transition-all group relative overflow-hidden"
                        >
                           <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <AlertCircle size={14} className="text-sky-300" />
                           </div>
                           <div className="w-14 h-14 rounded-2xl bg-sky-50 flex items-center justify-center text-sky-500 group-hover:bg-sky-600 group-hover:text-white transition-all shadow-inner">
                              <FileText size={28} />
                           </div>
                           <div className="w-full">
                              <p className="text-[11px] font-black text-sky-900 truncate px-1">{doc.title}</p>
                              <div className="mt-2 flex items-center justify-center gap-1.5 font-sans">
                                 <span className="px-2 py-0.5 bg-sky-50 text-sky-600 rounded text-[8px] font-black uppercase tracking-tighter border border-sky-100">{doc.type}</span>
                                 <span className="px-2 py-0.5 bg-slate-50 text-slate-400 rounded text-[8px] font-bold border border-slate-100">{(doc.chunkCount || 1)} mảnh</span>
                              </div>
                           </div>
                        </motion.div>
                      ))}
                   </div>
                   {documents.length === 0 && (
                      <div className="text-center py-20 bg-white/50 rounded-3xl border border-dashed border-slate-200">
                         <Database size={40} className="mx-auto text-slate-200 mb-4" />
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hệ thống tri thức đang trống</p>
                      </div>
                   )}
                </div>
             </div>
          </div>
       </div>
    </div>
  );
}

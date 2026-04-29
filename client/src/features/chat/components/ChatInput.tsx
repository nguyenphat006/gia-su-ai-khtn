import { useRef, useState } from "react";
import { Mic, Upload, XCircle, FileText, Loader2, SendHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { speechService } from "@/lib/speechService";
import { SelectedImage, SelectedFile } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface ChatInputProps {
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  selectedImage: SelectedImage | null;
  setSelectedImage: React.Dispatch<React.SetStateAction<SelectedImage | null>>;
  selectedFile: SelectedFile | null;
  setSelectedFile: React.Dispatch<React.SetStateAction<SelectedFile | null>>;
  handleSend: () => void;
}

export default function ChatInput({
  input, setInput, isLoading, setIsLoading,
  selectedImage, setSelectedImage, selectedFile, setSelectedFile, handleSend
}: ChatInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isRecording, setIsRecording] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage({
          data: (reader.result as string).split(",")[1],
          mimeType: file.type
        });
      };
      reader.readAsDataURL(file);
    } else {
      setIsLoading(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = (reader.result as string);
        try {
          const response = await fetch("/api/extract-text", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fileData: base64, fileName: file.name, mimeType: file.type })
          });
          const data = await response.json();
          if (data.text) {
            setSelectedFile({ name: file.name, content: data.text });
          } else {
            alert(data.error || "Không thể trích xuất văn bản từ tài liệu này.");
          }
        } catch (error) {
          console.error("File upload error:", error);
          alert("Lỗi kết nối máy chủ khi xử lý tài liệu.");
        } finally {
          setIsLoading(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleRecording = () => {
    if (!isRecording) {
      speechService.start(
        (text) => setInput(prev => (prev ? `${prev} ${text}` : text)),
        (error) => {
          console.error("Speech error:", error);
          setIsRecording(false);
        },
        () => setIsRecording(false)
      );
      setIsRecording(true);
    } else {
      speechService.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="shrink-0 p-3 sm:p-6 bg-white/95 backdrop-blur-md border-t border-slate-100 relative z-10">
      <div className="max-w-6xl mx-auto flex flex-col gap-2 sm:gap-3">
        
        {/* Preview Area */}
        <AnimatePresence>
          {(selectedImage || selectedFile) && (
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="flex gap-2 flex-wrap mb-1"
            >
              {selectedImage && (
                <div className="group relative p-1 bg-white rounded-xl border border-sky-100 shadow-lg inline-block">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg overflow-hidden bg-slate-100">
                    <img src={`data:${selectedImage.mimeType};base64,${selectedImage.data}`} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                  <button 
                    onClick={() => setSelectedImage(null)} 
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600 transition-colors"
                  >
                    <XCircle size={12} />
                  </button>
                </div>
              )}
              {selectedFile && (
                <div className="group relative p-2 bg-sky-50 rounded-xl border border-sky-100 shadow-md flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center text-white">
                    <FileText size={16} />
                  </div>
                  <div className="flex flex-col pr-4">
                    <span className="text-[9px] font-black text-sky-900 max-w-[120px] truncate">{selectedFile.name}</span>
                    <span className="text-[7px] text-sky-600 uppercase font-black">Tài liệu</span>
                  </div>
                  <button 
                    onClick={() => setSelectedFile(null)} 
                    className="absolute top-1 right-1 text-slate-400 hover:text-red-500"
                  >
                    <XCircle size={14} />
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Bar */}
        <div className={cn(
          "bg-slate-50/50 p-1.5 sm:p-2 rounded-2xl sm:rounded-[1.75rem] border-2 transition-all duration-300 flex items-center gap-1 sm:gap-2",
          isRecording 
            ? "border-red-400 bg-red-50/30 shadow-[0_0_20px_rgba(248,113,113,0.1)]" 
            : "border-slate-100 focus-within:border-sky-400 focus-within:bg-white focus-within:shadow-xl focus-within:shadow-sky-900/5"
        )}>
          <input 
            type="file" 
            className="hidden" 
            ref={fileInputRef} 
            accept="image/*,.pdf,.doc,.docx,text/plain"
            onChange={handleFileChange}
          />
          
          <div className="flex items-center">
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="p-2 sm:p-3 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-xl transition-all disabled:opacity-50"
            >
              <Upload size={18} sm:size={20} />
            </button>
            <button 
              onClick={toggleRecording}
              disabled={isLoading}
              className={cn(
                "p-2 sm:p-3 rounded-xl transition-all",
                isRecording ? "text-red-500 animate-pulse bg-red-50" : "text-slate-400 hover:text-sky-600 hover:bg-sky-50"
              )}
            >
              <Mic size={18} sm:size={20} />
            </button>
          </div>

          <div className="h-6 w-px bg-slate-200 mx-0.5 sm:mx-1"></div>

          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={isRecording ? "Đang ghi âm..." : (isLoading ? "Đang xử lý..." : "Hỏi cô giáo...")}
            className="flex-1 bg-transparent px-2 py-2 outline-none font-bold text-slate-800 text-xs sm:text-sm placeholder:text-slate-300"
            disabled={isLoading}
          />

          <button 
            onClick={handleSend}
            disabled={(!input.trim() && !selectedImage && !selectedFile) || isLoading}
            className={cn(
              "p-3 sm:p-4 rounded-xl sm:rounded-2xl transition-all duration-300 flex items-center justify-center active:scale-90",
              (!input.trim() && !selectedImage && !selectedFile) || isLoading
                ? "bg-slate-200 text-slate-400"
                : "bg-sky-600 text-white shadow-lg shadow-sky-200 hover:bg-sky-700"
            )}
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <SendHorizontal size={18} sm:size={22} />}
          </button>
        </div>
        
        <p className="text-[8px] text-slate-300 font-bold uppercase tracking-[0.2em] text-center">
          Nhấn Enter để gửi nhanh
        </p>
      </div>
    </div>
  );
}

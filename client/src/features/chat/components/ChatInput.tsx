import { useRef, useState } from "react";
import { Mic, Upload, XCircle, FileText, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { speechService } from "@/lib/speechService";
import { SelectedImage, SelectedFile } from "../types";

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
    <div className="absolute bottom-0 left-0 right-0 p-4 bg-sky-50/80 backdrop-blur-md mb-2">
      <div className="w-[85%] md:w-full max-w-4xl mx-auto">
        <div className="flex gap-2 mb-2 flex-wrap">
          {selectedImage && (
            <div className="p-2 bg-white rounded-xl border border-sky-100 inline-flex items-center gap-2 shadow-sm animate-in fade-in slide-in-from-bottom-2">
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100">
                  <img src={`data:${selectedImage.mimeType};base64,${selectedImage.data}`} alt="Preview" className="w-full h-full object-cover" />
              </div>
              <button onClick={() => setSelectedImage(null)} className="text-red-500 p-1 hover:bg-red-50 rounded-md transition-colors">
                  <XCircle size={16} />
              </button>
            </div>
          )}
          {selectedFile && (
            <div className="p-2 bg-sky-50 rounded-xl border border-sky-100 inline-flex items-center gap-2 shadow-sm animate-in fade-in slide-in-from-bottom-2">
              <div className="w-10 h-10 rounded-lg bg-sky-600 flex items-center justify-center text-white">
                  <FileText size={20} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-sky-800 max-w-[150px] truncate">{selectedFile.name}</span>
                <span className="text-[8px] text-sky-600 uppercase font-black">Tài liệu đã tải</span>
              </div>
              <button onClick={() => setSelectedFile(null)} className="text-red-500 p-1 hover:bg-red-50 rounded-md transition-colors">
                  <XCircle size={16} />
              </button>
            </div>
          )}
        </div>
        
        <div className={cn(
          "bg-white p-2 rounded-2xl border transition-all flex items-center gap-1",
          isRecording ? "border-red-500 shadow-red-100 ring-4 ring-red-50" : "border-sky-200 shadow-lg"
        )}>
           <input 
             type="file" 
             className="hidden" 
             ref={fileInputRef} 
             accept="image/*,.pdf,.doc,.docx,text/plain"
             onChange={handleFileChange}
           />
           <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="p-2 text-sky-600 hover:bg-sky-50 rounded-xl transition-all disabled:opacity-50"
              title="Tải lên hình ảnh/tài liệu"
           >
              <Upload size={20} />
           </button>
           <button 
              onClick={toggleRecording}
              disabled={isLoading}
              className={cn(
                "p-2 rounded-xl transition-all",
                isRecording ? "text-red-500 animate-pulse bg-red-50" : "text-sky-600 hover:bg-sky-50"
              )}
              title={isRecording ? "Dừng ghi âm" : "Ghi âm câu hỏi"}
           >
              <Mic size={20} />
           </button>
           <input 
             type="text" 
             value={input}
             onChange={(e) => setInput(e.target.value)}
             onKeyDown={(e) => e.key === "Enter" && handleSend()}
             placeholder={isRecording ? "Đang nghe em nói..." : (isLoading ? "Đang xử lý..." : "Nhập câu hỏi của em tại đây...")}
             className="flex-1 bg-transparent px-3 py-2 outline-none font-bold text-black text-sm focus:ring-0 disabled:opacity-50"
             disabled={isLoading}
           />
           <button 
             onClick={handleSend}
             disabled={(!input.trim() && !selectedImage && !selectedFile) || isLoading}
             className="bg-sky-600 text-white px-5 py-2 rounded-xl hover:bg-sky-700 disabled:opacity-50 shadow-md transition-all active:scale-95 text-sm font-bold flex items-center gap-2"
           >
             {isLoading ? <Loader2 size={16} className="animate-spin" /> : "Gửi"}
           </button>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { adminService } from "../service";

export default function SystemConfigTab() {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    async function loadPrompt() {
      try {
        const config = await adminService.getConfig("AI_SYSTEM_PROMPT");
        if (config) {
          setPrompt(config.value);
        }
      } catch (error: any) {
        setMessage({ type: "error", text: "Lỗi khi tải Prompt: " + error.message });
      } finally {
        setIsLoading(false);
      }
    }
    loadPrompt();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      await adminService.updateConfig("AI_SYSTEM_PROMPT", prompt);
      setMessage({ type: "success", text: "Lưu cấu hình thành công!" });
    } catch (error: any) {
      setMessage({ type: "error", text: "Lỗi khi lưu: " + error.message });
    } finally {
      setIsSaving(false);
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
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 max-w-4xl">
      <h2 className="text-xl font-bold text-slate-800 mb-2">Cấu hình System Prompt</h2>
      <p className="text-sm text-slate-500 mb-6">
        Đây là phần thiết lập vai trò, tính cách và các giới hạn cốt lõi của Trợ lý AI. AI sẽ luôn tuân thủ các quy tắc trong văn bản này.
      </p>

      {message && (
        <div className={`mb-4 p-4 rounded-xl text-sm font-bold ${message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {message.text}
        </div>
      )}

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        className="w-full h-[400px] p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 font-mono text-sm resize-y text-slate-800 custom-scrollbar mb-6"
        placeholder="Nhập System Prompt..."
      />

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-sky-600 hover:bg-sky-700 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
        >
          {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          Lưu thay đổi
        </button>
      </div>
    </div>
  );
}

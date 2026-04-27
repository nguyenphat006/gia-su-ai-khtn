import { useState } from "react";
import { Loader2, ChevronRight } from "lucide-react";
import { studentLogin, syncStudentData, uploadFile } from "@/lib/firebase";

export default function LoginForm() {
  const [studentName, setStudentName] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [selectedImageFile] = useState<File | null>(null);

  const handleLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!studentName.trim() || !password.trim() || isLoggingIn) return;

    setIsLoggingIn(true);
    try {
      const user = await studentLogin(studentName.trim(), password.trim());
      await syncStudentData(user, { displayName: studentName.trim() });

      if (selectedImageFile) {
        try {
          const uploadedUrl = await uploadFile(selectedImageFile, `avatars/${user.uid}`);
          await syncStudentData(user, { photoURL: uploadedUrl });
        } catch (uploadError) {
          console.error("Upload error:", uploadError);
        }
      }
    } catch (error: any) {
      console.error("Lỗi đăng nhập:", error);
      alert(error.message || "Có lỗi xảy ra khi bắt đầu. Vui lòng thử lại.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <div className="text-left">
        <label className="block text-[10px] font-bold text-black uppercase tracking-widest mb-1.5 ml-4 text-slate-400">
          Họ và tên của em
        </label>
        <input
          type="text"
          required
          value={studentName}
          onChange={(e) => setStudentName(e.target.value)}
          placeholder="Nhập tên chính xác của em..."
          className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-sky-500 transition-all font-bold text-sky-900"
        />
      </div>

      <div className="text-left">
        <label className="block text-[10px] font-bold text-black uppercase tracking-widest mb-1.5 ml-4 text-slate-400">
          Mật khẩu truy cập
        </label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Nhập mật khẩu của em..."
          className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-sky-500 transition-all font-bold text-sky-900"
        />
      </div>

      <button
        type="submit"
        disabled={!studentName.trim() || !password.trim() || isLoggingIn}
        className="w-full bg-sky-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-sky-200/50 hover:bg-sky-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95 uppercase tracking-widest text-xs"
      >
        {isLoggingIn ? (
          <Loader2 className="animate-spin" size={24} />
        ) : (
          <>
            Đăng nhập
            <ChevronRight size={20} />
          </>
        )}
      </button>
    </form>
  );
}

import { useState } from "react";
import { motion } from "motion/react";
import { Loader2, ChevronRight } from "lucide-react";
import { studentLogin, syncStudentData, uploadFile } from "@/lib/firebase";

interface LoginPageProps {
  schoolLogo: string | null;
}

export default function LoginPage({ schoolLogo }: LoginPageProps) {
  const [studentName, setStudentName] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);

  const handleLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!studentName.trim() || !password.trim() || isLoggingIn) return;

    setIsLoggingIn(true);
    try {
      const user = await studentLogin(studentName.trim(), password.trim());
      await syncStudentData(user, { displayName: studentName.trim() });

      if (selectedImageFile) {
        try {
          const uploadedUrl = await uploadFile(
            selectedImageFile,
            `avatars/${user.uid}`
          );
          await syncStudentData(user, { photoURL: uploadedUrl });
        } catch (uploadError) {
          console.error("Upload error:", uploadError);
        }
      }
    } catch (error: any) {
      console.error("Lỗi đăng nhập:", error);
      alert(
        error.message || "Có lỗi xảy ra khi bắt đầu. Vui lòng thử lại."
      );
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-sky-600 flex items-center justify-center p-6 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-sky-500 to-sky-700">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-10 text-center"
      >
        <div className="mb-8 mt-4 flex items-center justify-center gap-4">
          {schoolLogo && (
            <img
              src={schoolLogo}
              alt="Logo"
              className="w-16 h-16 object-contain"
            />
          )}
          <div>
            <h1 className="text-3xl font-display font-black text-sky-900 mb-2 tracking-tight">
              Gia sư AI KHTN
            </h1>
            <p className="text-black font-bold text-sm tracking-tight uppercase">
              Trường THCS Phước Tân 3
            </p>
          </div>
        </div>

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
            disabled={
              !studentName.trim() || !password.trim() || isLoggingIn
            }
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

        <p className="mt-8 text-[10px] text-slate-400 font-bold leading-relaxed bg-slate-50 px-6 py-4 rounded-3xl border border-slate-100 text-left italic">
          💡 <b>Lưu ý:</b> Nếu là lần đầu, em hãy tự đặt một mật khẩu.
          Lần sau chỉ cần đúng <b>Tên & Mật khẩu</b> này là điểm EXP cũ sẽ
          được giữ nguyên.
        </p>

        <p className="mt-10 text-[9px] text-slate-400 font-medium uppercase tracking-widest leading-relaxed">
          © 2026 GIA SƯ AI KHTN TRƯỜNG THCS PHƯỚC TÂN 3
          <br />
          Phát triển bởi cô Vũ Thị Thu Trang
        </p>
      </motion.div>
    </div>
  );
}

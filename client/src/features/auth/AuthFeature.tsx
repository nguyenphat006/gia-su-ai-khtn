import { motion } from "motion/react";
import LoginForm from "./components/LoginForm";
import { SCHOOL_LOGO_URL } from "@/hooks/useAuth";

export default function AuthFeature() {
  return (
    <div className="min-h-screen bg-sky-600 flex items-center justify-center p-6 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-sky-500 to-sky-700">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-10 text-center"
      >
        <div className="mb-8 mt-4 flex flex-col items-center justify-center gap-4">
          <img
            src={SCHOOL_LOGO_URL}
            alt="School Logo"
            className="w-52 h-auto object-contain mb-2"
          />
          <div>
            <h1 className="text-3xl font-display font-black text-sky-900 mb-2 tracking-tight">
              Gia sư AI KHTN
            </h1>
          </div>
        </div>

        <LoginForm />

        <p className="mt-8 text-[10px] text-slate-400 font-bold leading-relaxed bg-slate-50 px-6 py-4 rounded-3xl border border-slate-100 text-left italic">
          💡 <b>Lưu ý:</b> Nếu là lần đầu, em hãy tự đặt một mật khẩu.
          Lần sau chỉ cần đúng <b>Tên & Mật khẩu</b> này là điểm EXP cũ sẽ
          được giữ nguyên.
        </p>

        <p className="mt-10 text-[9px] text-slate-400 font-medium uppercase tracking-widest leading-relaxed">
          © 2026 GIA SƯ AI KHTN
          <br />
          Phát triển bởi cô Vũ Thị Thu Trang
        </p>
      </motion.div>
    </div>
  );
}

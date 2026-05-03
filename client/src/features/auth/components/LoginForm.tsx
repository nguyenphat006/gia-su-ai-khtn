import { useState } from "react";
import { ChevronRight, Loader2 } from "lucide-react";
import type { LoginInput } from "../types";

interface LoginFormProps {
  onLogin: (input: LoginInput) => Promise<unknown>;
}

export default function LoginForm({ onLogin }: LoginFormProps) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!identifier.trim() || !password.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setError("");

    try {
      await onLogin({
        identifier: identifier.trim(),
        password,
      });
    } catch (submitError: any) {
      console.error("Auth error:", submitError);
      setError(submitError.message || "Không thể kết nối tới máy chủ xác thực.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-display font-black text-sky-950 tracking-tight uppercase">
          Đăng nhập
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-500 font-medium">Chào mừng bạn quay lại với hệ thống Gia Sư AI KHTN.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Field
          label="Tên đăng nhập / Mã định danh"
          value={identifier}
          onChange={setIdentifier}
          placeholder="vd: hocsinh_6a012 hoặc admin"
        />

        <Field
          label="Mật khẩu"
          value={password}
          onChange={setPassword}
          placeholder="Nhập mật khẩu của bạn..."
          type="password"
        />

        {error && (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-600 animate-in fade-in slide-in-from-top-2">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={!identifier.trim() || !password.trim() || isSubmitting}
          className="w-full bg-sky-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-sky-200/50 hover:bg-sky-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-[0.98] uppercase tracking-widest text-xs"
        >
          {isSubmitting ? (
            <Loader2 className="animate-spin" size={22} />
          ) : (
            <>
              Vào hệ thống học tập
              <ChevronRight size={18} />
            </>
          )}
        </button>
      </form>

      <div className="mt-8 rounded-[1.5rem] border border-slate-100 bg-slate-50 px-6 py-5 text-left">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">
          Hướng dẫn nhanh
        </p>
        <p className="text-xs leading-relaxed text-slate-600 font-medium">
          Nếu bạn chưa có tài khoản, vui lòng liên hệ Quản trị viên để được cấp. 
          Trong lần đăng nhập đầu tiên, hệ thống sẽ yêu cầu bạn đổi mật khẩu mới để bảo vệ thông tin cá nhân.
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <div className="text-left">
      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-4">
        {label}
      </label>
      <input
        type={type}
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-sky-500 focus:bg-white transition-all font-bold text-sky-900 placeholder:text-slate-300 shadow-inner"
      />
    </div>
  );
}

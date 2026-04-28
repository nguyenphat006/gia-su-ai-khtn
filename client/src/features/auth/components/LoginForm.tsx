import { useState } from "react";
import { ChevronRight, Loader2, ShieldCheck, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LoginInput } from "../types";

type AuthMode = "student-login" | "teacher-login";

interface LoginFormProps {
  onLogin: (input: LoginInput) => Promise<unknown>;
}

const MODE_META: Record<
  AuthMode,
  {
    title: string;
    description: string;
    icon: React.ReactNode;
    submitLabel: string;
    placeholder: string;
  }
> = {
  "student-login": {
    title: "Đăng nhập Học sinh",
    description: "Sử dụng mã học sinh hoặc tên đăng nhập để vào lớp học AI.",
    icon: <UserRound size={16} />,
    submitLabel: "Vào lớp học AI",
    placeholder: "vd: HS6A012 hoặc hocsinh_6a012",
  },
  "teacher-login": {
    title: "Đăng nhập Giáo viên",
    description: "Dành cho giáo viên và quản trị viên quản lý hệ thống.",
    icon: <ShieldCheck size={16} />,
    submitLabel: "Vào khu quản lý",
    placeholder: "vd: cotrang hoặc teacher@school.vn",
  },
};

export default function LoginForm({ onLogin }: LoginFormProps) {
  const [mode, setMode] = useState<AuthMode>("student-login");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const meta = MODE_META[mode];

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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6 bg-slate-50 rounded-[1.5rem] p-2 border border-slate-100">
        {(["student-login", "teacher-login"] as AuthMode[]).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              setMode(value);
              setError("");
            }}
            className={cn(
              "rounded-[1.1rem] px-4 py-3 text-left transition-all border",
              mode === value
                ? "bg-white border-sky-100 shadow-sm"
                : "border-transparent hover:bg-white/70"
            )}
          >
            <div className="flex items-center gap-2 text-sky-700 font-bold text-xs uppercase tracking-wider">
              {MODE_META[value].icon}
              {value === "student-login" ? "Học sinh" : "Giáo viên"}
            </div>
          </button>
        ))}
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-display font-black text-sky-950 tracking-tight">
          {meta.title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">{meta.description}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field
          label="Tên đăng nhập / Mã định danh"
          value={identifier}
          onChange={setIdentifier}
          placeholder={meta.placeholder}
        />

        <Field
          label="Mật khẩu"
          value={password}
          onChange={setPassword}
          placeholder="Nhập mật khẩu..."
          type="password"
        />

        {error && (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={!identifier.trim() || !password.trim() || isSubmitting}
          className="w-full bg-sky-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-sky-200/50 hover:bg-sky-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-[0.99] uppercase tracking-widest text-xs"
        >
          {isSubmitting ? (
            <Loader2 className="animate-spin" size={22} />
          ) : (
            <>
              {meta.submitLabel}
              <ChevronRight size={18} />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 rounded-[1.5rem] border border-slate-100 bg-slate-50 px-5 py-4 text-left">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
          Hướng dẫn nhanh
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Nếu em là học sinh chưa có tài khoản, vui lòng liên hệ giáo viên để được cấp. 
          Nếu lần đầu đăng nhập, hệ thống sẽ yêu cầu em đổi mật khẩu để bảo mật.
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
      <label className="block text-[10px] font-bold text-black uppercase tracking-widest mb-1.5 ml-4 text-slate-400">
        {label}
      </label>
      <input
        type={type}
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-sky-500 transition-all font-bold text-sky-900"
      />
    </div>
  );
}

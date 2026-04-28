import { useMemo, useState } from "react";
import { ChevronRight, KeyRound, Loader2, ShieldCheck, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { type ActivateAccountInput, type LoginInput } from "@/lib/auth";

type AuthMode = "student-login" | "activate" | "teacher-login";

interface LoginFormProps {
  onStudentLogin: (input: LoginInput) => Promise<unknown>;
  onTeacherLogin: (input: LoginInput) => Promise<unknown>;
  onActivateAccount: (input: ActivateAccountInput) => Promise<unknown>;
}

const MODE_META: Record<
  AuthMode,
  {
    title: string;
    description: string;
    icon: React.ReactNode;
    submitLabel: string;
  }
> = {
  "student-login": {
    title: "Đăng nhập học sinh",
    description: "Dùng mã học sinh hoặc tên đăng nhập cùng mật khẩu đã được kích hoạt trước đó.",
    icon: <UserRound size={16} />,
    submitLabel: "Vào lớp học AI",
  },
  activate: {
    title: "Kích hoạt lần đầu",
    description: "Nhập mã học sinh hoặc tên đăng nhập, mã kích hoạt và mật khẩu mới để bắt đầu sử dụng.",
    icon: <ShieldCheck size={16} />,
    submitLabel: "Kích hoạt tài khoản",
  },
  "teacher-login": {
    title: "Đăng nhập giáo viên",
    description: "Dành cho giáo viên và quản trị viên để quản lý lớp học, tài liệu và tri thức hệ thống.",
    icon: <KeyRound size={16} />,
    submitLabel: "Vào khu quản lý",
  },
};

export default function LoginForm({
  onStudentLogin,
  onTeacherLogin,
  onActivateAccount,
}: LoginFormProps) {
  const [mode, setMode] = useState<AuthMode>("student-login");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [activationCode, setActivationCode] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const meta = MODE_META[mode];
  const identifierLabel = useMemo(() => {
    if (mode === "teacher-login") return "Tên đăng nhập hoặc email";
    return "Mã học sinh hoặc tên đăng nhập";
  }, [mode]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!identifier.trim() || !password.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setError("");

    try {
      if (mode === "student-login") {
        await onStudentLogin({
          identifier: identifier.trim(),
          password,
        });
      } else if (mode === "teacher-login") {
        await onTeacherLogin({
          identifier: identifier.trim(),
          password,
        });
      } else {
        if (!activationCode.trim()) {
          throw new Error("Mã kích hoạt là bắt buộc.");
        }

        await onActivateAccount({
          identifier: identifier.trim(),
          password,
          activationCode: activationCode.trim(),
          displayName: displayName.trim() || undefined,
        });
      }
    } catch (submitError: any) {
      console.error("Auth error:", submitError);
      setError(submitError.message || "Không thể kết nối tới máy chủ xác thực.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-6 bg-slate-50 rounded-[1.5rem] p-2 border border-slate-100">
        {(["student-login", "activate", "teacher-login"] as AuthMode[]).map((value) => (
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
            <div className="flex items-center gap-2 text-sky-700 font-bold text-xs">
              {MODE_META[value].icon}
              {MODE_META[value].title}
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
          label={identifierLabel}
          value={identifier}
          onChange={setIdentifier}
          placeholder={mode === "teacher-login" ? "vd: cotrang hoặc teacher@school.vn" : "vd: HS6A012 hoặc hocsinh_6a012"}
        />

        {mode === "activate" && (
          <>
            <Field
              label="Mã kích hoạt"
              value={activationCode}
              onChange={setActivationCode}
              placeholder="Nhập mã kích hoạt do nhà trường cấp..."
            />
            <Field
              label="Họ và tên hiển thị"
              value={displayName}
              onChange={setDisplayName}
              placeholder="Tên hiển thị của em..."
            />
          </>
        )}

        <Field
          label={mode === "activate" ? "Mật khẩu mới" : "Mật khẩu"}
          value={password}
          onChange={setPassword}
          placeholder={mode === "activate" ? "Tạo mật khẩu gồm chữ và số..." : "Nhập mật khẩu của em..."}
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
          Nếu em là học sinh mới, hãy chọn <b>Kích hoạt lần đầu</b>. Nếu quên mật khẩu,
          em hãy liên hệ giáo viên hoặc quản trị viên để được cấp lại quyền truy cập.
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

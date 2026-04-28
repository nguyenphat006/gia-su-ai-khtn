import { motion } from "motion/react";
import LoginForm from "./components/LoginForm";
import { SCHOOL_LOGO_URL } from "@/hooks/useAuth";
import { type ActivateAccountInput, type LoginInput } from "@/lib/auth";

interface AuthFeatureProps {
  onStudentLogin: (input: LoginInput) => Promise<unknown>;
  onTeacherLogin: (input: LoginInput) => Promise<unknown>;
  onActivateAccount: (input: ActivateAccountInput) => Promise<unknown>;
}

export default function AuthFeature({
  onStudentLogin,
  onTeacherLogin,
  onActivateAccount,
}: AuthFeatureProps) {
  return (
    <div className="min-h-screen bg-sky-600 flex items-center justify-center p-6 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-sky-500 to-sky-700">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-5xl bg-white rounded-[2rem] shadow-2xl overflow-hidden grid lg:grid-cols-[1.05fr_1fr]"
      >
        <div className="bg-[linear-gradient(160deg,#0f4c81_0%,#0369a1_45%,#38bdf8_100%)] text-white p-10 lg:p-12 flex flex-col justify-between">
          <div>
            <div className="w-28 h-28 bg-white/10 border border-white/15 rounded-[2rem] flex items-center justify-center backdrop-blur">
              <img
                src={SCHOOL_LOGO_URL}
                alt="School Logo"
                className="w-20 h-auto object-contain"
              />
            </div>

            <h1 className="mt-8 text-4xl font-display font-black tracking-tight leading-none">
              Gia Sư AI KHTN
            </h1>
            <p className="mt-4 text-sm leading-7 text-white/85 max-w-md">
              Hệ thống học tập thông minh dành cho học sinh THCS Phước Tân 3.
              Đăng nhập bằng tài khoản do nhà trường cấp, hoặc kích hoạt lần
              đầu để bắt đầu hành trình học tập.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-3 mt-10">
            <InfoPill title="Học sinh" description="Đăng nhập bằng mã học sinh hoặc tên đăng nhập" />
            <InfoPill title="Lần đầu" description="Kích hoạt tài khoản bằng mã kích hoạt" />
            <InfoPill title="Giáo viên" description="Đăng nhập riêng để quản lý lớp và tri thức" />
          </div>
        </div>

        <div className="p-8 lg:p-10">
          <LoginForm
            onStudentLogin={onStudentLogin}
            onTeacherLogin={onTeacherLogin}
            onActivateAccount={onActivateAccount}
          />
        </div>
      </motion.div>
    </div>
  );
}

function InfoPill({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-[1.5rem] bg-white/10 border border-white/15 px-4 py-4 backdrop-blur-sm text-left">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">{title}</p>
      <p className="mt-2 text-sm font-semibold leading-5 text-white">{description}</p>
    </div>
  );
}

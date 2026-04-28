import { useState } from "react";
import { motion } from "motion/react";
import { LogOut, Loader2, ShieldCheck, Zap } from "lucide-react";
import { type AuthenticatedUser } from "@/lib/auth";

interface ProfileEditModalProps {
  user: AuthenticatedUser;
  studentData: any;
  onClose: () => void;
}

export default function ProfileEditModal({
  user,
  studentData,
  onClose,
}: ProfileEditModalProps) {
  const [newName, setNewName] = useState(
    user.displayName || studentData?.displayName || ""
  );
  const [isUpdatingName, setIsUpdatingName] = useState(false);

  const handleUpdateName = async () => {
    if (!newName.trim() || isUpdatingName) return;
    setIsUpdatingName(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 400));
      alert("Chỉnh sửa hồ sơ sẽ được nối sang backend ở pha tiếp theo.");
      onClose();
    } catch (error) {
      console.error("Lỗi cập nhật tên:", error);
      alert("Không thể lưu tên. Vui lòng thử lại.");
    } finally {
      setIsUpdatingName(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-sky-900/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-[2.5rem] p-8 w-full max-w-sm shadow-2xl border border-sky-50"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-display font-black text-sky-900 tracking-tight">
            Cập nhật họ tên
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <LogOut size={20} className="rotate-180" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col items-center mb-6">
            <div className="relative group/avatar">
              <div className="w-24 h-24 rounded-full border-4 border-sky-50 overflow-hidden shadow-lg bg-sky-50 flex items-center justify-center">
                {studentData?.photoURL || user.studentProfile?.avatarUrl || user.teacherProfile?.avatarUrl ? (
                  <img
                    src={studentData?.photoURL || user.studentProfile?.avatarUrl || user.teacherProfile?.avatarUrl || ""}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="text-3xl font-bold text-sky-600">
                    {studentData?.displayName?.[0] || "?"}
                  </span>
                )}
              </div>
              <div className="absolute bottom-0 right-0 p-2 bg-emerald-600 text-white rounded-full shadow-lg">
                <ShieldCheck size={16} />
              </div>
            </div>
            <p className="text-[10px] font-black text-black uppercase tracking-widest mt-3">
              Ảnh đại diện của em
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col gap-2">
            <p className="text-[10px] font-black text-black uppercase tracking-widest">
              Mã người dùng của em
            </p>
            <div className="flex items-center justify-between gap-2 overflow-hidden">
              <code className="text-[10px] font-mono text-sky-700 truncate bg-white px-2 py-1 rounded border border-sky-50 flex-1">
                {user.id}
              </code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(user.id);
                  alert("Đã sao chép mã người dùng!");
                }}
                className="p-1.5 hover:bg-sky-100 rounded-lg text-sky-600 transition-colors shrink-0"
                title="Sao chép mã"
              >
                <Zap size={14} />
              </button>
            </div>
          </div>

          <div className="text-left">
            <label className="block text-[10px] font-bold text-black uppercase tracking-[0.2em] mb-2 ml-4">
              Họ và tên mới
            </label>
            <input
              type="text"
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nhập tên thật của em..."
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-sky-500 transition-all font-bold text-sky-900"
            />
          </div>

          <div className="p-4 bg-sky-50 rounded-2xl border border-sky-100">
            <p className="text-[11px] text-sky-700 leading-relaxed font-medium">
              Hồ sơ cá nhân đang được chuyển dần sang backend mới. Ở pha này,
              em đã đăng nhập bằng tài khoản server-side an toàn hơn; chỉnh sửa
              hồ sơ sẽ được nối hoàn chỉnh ở bước tiếp theo.
            </p>
          </div>

          <button
            onClick={handleUpdateName}
            disabled={!newName.trim() || isUpdatingName}
            className="w-full bg-sky-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-sky-200/50 hover:bg-sky-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {isUpdatingName ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              "Lưu tên & Cập nhật"
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

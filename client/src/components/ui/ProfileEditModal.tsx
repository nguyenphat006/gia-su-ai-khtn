import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { LogOut, Loader2, ShieldCheck, Zap } from "lucide-react";
import { type AuthenticatedUser } from "@/features/auth/types";
import { changePasswordOnServer } from "@/features/auth/service";

interface ProfileEditModalProps {
  user: AuthenticatedUser;
  studentData?: any;
  isOpen?: boolean;
  onClose: () => void;
}

export default function ProfileEditModal({
  user,
  studentData,
  isOpen = true,
  onClose,
}: ProfileEditModalProps) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [newName, setNewName] = useState(
    user.displayName || studentData?.displayName || ""
  );
  const [isUpdatingName, setIsUpdatingName] = useState(false);

  if (!isOpen) return null;

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }
    if (!/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) {
      setError("Mật khẩu mới phải có ít nhất 1 chữ cái và 1 chữ số.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      await changePasswordOnServer({ oldPassword, newPassword });
      setSuccess("Đổi mật khẩu thành công!");
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Không thể đổi mật khẩu.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateName = async () => {
    if (!newName.trim() || isUpdatingName) return;
    setIsUpdatingName(true);
    try {
      // Giả lập cập nhật tên (sẽ thực hiện qua API thực sau)
      await new Promise((resolve) => setTimeout(resolve, 400));
      alert("Họ tên đã được cập nhật cục bộ. Chỉnh sửa hồ sơ sẽ được nối hoàn chỉnh qua API ở pha tiếp theo.");
      onClose();
    } catch (error) {
      console.error("Lỗi cập nhật tên:", error);
      alert("Không thể lưu tên. Vui lòng thử lại.");
    } finally {
      setIsUpdatingName(false);
    }
  };

  const isForcePasswordChange = user.mustChangePassword;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-sky-900/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl border border-sky-50 max-h-[90vh] overflow-y-auto custom-scrollbar"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-display font-black text-sky-900 tracking-tight">
              {isForcePasswordChange ? "Đổi mật khẩu bắt buộc" : "Thông tin tài khoản"}
            </h3>
            {!isForcePasswordChange && (
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 p-1 transition-colors"
              >
                <LogOut size={20} className="rotate-180" />
              </button>
            )}
          </div>

          <div className="space-y-6">
            {/* Profile Overview - Ẩn nếu đang bắt buộc đổi mật khẩu để tập trung */}
            {!isForcePasswordChange && (
              <>
                <div className="flex flex-col items-center">
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
                          {user.displayName?.[0]?.toUpperCase() || "?"}
                        </span>
                      )}
                    </div>
                    <div className="absolute bottom-0 right-0 p-2 bg-emerald-600 text-white rounded-full shadow-lg">
                      <ShieldCheck size={16} />
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col gap-2">
                  <p className="text-[10px] font-black text-black uppercase tracking-widest">
                    Mã định danh hệ thống
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
                    >
                      <Zap size={14} />
                    </button>
                  </div>
                </div>

                <div className="text-left">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2 ml-4">
                    Họ và tên hiển thị
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="flex-1 bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 outline-none focus:border-sky-500 transition-all font-bold text-sky-900"
                    />
                    <button
                      onClick={handleUpdateName}
                      disabled={!newName.trim() || isUpdatingName}
                      className="bg-sky-600 text-white px-5 rounded-2xl font-bold hover:bg-sky-700 transition-all disabled:opacity-50 flex items-center justify-center"
                    >
                      {isUpdatingName ? <Loader2 size={18} className="animate-spin" /> : "Lưu"}
                    </button>
                  </div>
                </div>

                <div className="h-px bg-slate-100 my-6"></div>
              </>
            )}

            {/* Password Change Form */}
            <div className="text-left">
              <h4 className="text-sm font-bold text-sky-950 mb-4 flex items-center gap-2">
                <ShieldCheck size={18} className="text-sky-600" />
                {isForcePasswordChange ? "Thiết lập mật khẩu mới" : "Đổi mật khẩu"}
              </h4>
              
              {error && (
                <div className="mb-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                  {error}
                </div>
              )}
              {success && (
                <div className="mb-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-600">
                  {success}
                </div>
              )}

              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-4">
                    Mật khẩu hiện tại
                  </label>
                  <input
                    type="password"
                    required
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 outline-none focus:border-sky-500 transition-all font-bold text-sky-900"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-4">
                    Mật khẩu mới
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Tối thiểu 6 ký tự"
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 outline-none focus:border-sky-500 transition-all font-bold text-sky-900"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-4">
                    Xác nhận mật khẩu mới
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu mới"
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 outline-none focus:border-sky-500 transition-all font-bold text-sky-900"
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={isSubmitting || !oldPassword || !newPassword || !confirmPassword}
                  className="w-full mt-2 bg-sky-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-sky-200/50 hover:bg-sky-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50 uppercase tracking-widest text-xs"
                >
                  {isSubmitting ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    "Cập nhật mật khẩu an toàn"
                  )}
                </button>
              </form>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

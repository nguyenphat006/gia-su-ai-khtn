import * as React from "react"
import {
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Spinner from "@/components/ui/Spinner"
import { adminUserService } from "../services/user.service"
import { adminClassService } from "../../class-management/services/class.service"
import { Plus, Save, User as UserIcon, Shield, GraduationCap } from "lucide-react"
import { ResponsiveModal } from "@/components/ui/ResponsiveModal"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "motion/react"

interface UserFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  userData?: any // If provided, we are in Edit mode
}

export default function UserFormModal({
  isOpen,
  onClose,
  onSuccess,
  userData,
}: UserFormModalProps) {
  const isEdit = !!userData
  const [loading, setLoading] = React.useState(false)
  const [classes, setClasses] = React.useState<any[]>([])
  const [loadingClasses, setLoadingClasses] = React.useState(false)

  // Form fields
  const [role, setRole] = React.useState<"STUDENT" | "TEACHER" | "ADMIN">("STUDENT")
  const [username, setUsername] = React.useState("")
  const [displayName, setDisplayName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [status, setStatus] = React.useState("ACTIVE")
  
  // Role-specific fields
  const [classId, setClassId] = React.useState("")
  const [grade, setGrade] = React.useState(0)
  const [studentCode, setStudentCode] = React.useState("")
  const [employeeCode, setEmployeeCode] = React.useState("")
  const [subject, setSubject] = React.useState("")

  React.useEffect(() => {
    if (isOpen) {
      fetchClasses()
      if (userData) {
        // Fetch detail to get latest data
        const loadDetail = async () => {
          setLoading(true)
          try {
            const res = await adminUserService.getUserDetail(userData.id)
            const u = res.data.user
            setRole(u.role)
            setUsername(u.username)
            setDisplayName(u.displayName)
            setEmail(u.email || "")
            setStatus(u.status)
            setClassId(u.classId || "")
            setGrade(u.studentProfile?.grade || 0)
            setStudentCode(u.studentProfile?.studentCode || "")
            setEmployeeCode(u.teacherProfile?.employeeCode || "")
            setSubject(u.teacherProfile?.subject || "")
            setPassword("") 
          } catch (err) {
            console.error("Lỗi lấy chi tiết:", err)
          } finally {
            setLoading(false)
          }
        }
        loadDetail()
      } else {
        setRole("STUDENT")
        setUsername("")
        setDisplayName("")
        setEmail("")
        setStatus("ACTIVE")
        setClassId("")
        setGrade(0)
        setStudentCode("")
        setEmployeeCode("")
        setSubject("")
        setPassword("123456") // Default password
      }
    }
  }, [isOpen, userData])

  const [classSearch, setClassSearch] = React.useState("")
  const filteredClasses = React.useMemo(() => {
    return classes.filter(c => 
      c.name.toLowerCase().includes(classSearch.toLowerCase()) || 
      c.code.toLowerCase().includes(classSearch.toLowerCase())
    )
  }, [classes, classSearch])

  const handleClassChange = (cid: string) => {
    setClassId(cid)
    const selectedClass = classes.find(c => c.id === cid)
    if (selectedClass) {
      setGrade(selectedClass.grade)
    }
  }

  const fetchClasses = async () => {
    setLoadingClasses(true)
    try {
      const response = await adminClassService.getClasses({ limit: 100 })
      setClasses(response.data.classes)
    } catch (error) {
      console.error("Lỗi khi tải danh sách lớp:", error)
    } finally {
      setLoadingClasses(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !displayName.trim()) return

    setLoading(true)
    try {
      const payload: any = {
        role,
        username: username.trim(),
        displayName: displayName.trim(),
        email: email.trim() || null,
        status,
      }

      if (password) payload.password = password

      if (role === "STUDENT") {
        payload.classId = classId || null
        payload.studentCode = studentCode.trim() || null
        payload.grade = grade
      } else if (role === "TEACHER") {
        payload.employeeCode = employeeCode.trim() || null
        payload.subject = subject.trim() || null
      }

      if (isEdit) {
        await adminUserService.updateUser(userData.id, payload)
        toast.success("Cập nhật người dùng thành công!")
      } else {
        await adminUserService.createUser(payload)
        toast.success("Tạo người dùng mới thành công!")
      }
      onSuccess()
      onClose()
    } catch (error: any) {
      toast.error(error.message || "Đã có lỗi xảy ra.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onOpenChange={onClose}
      title={isEdit ? "Chỉnh sửa người dùng" : "Thêm người dùng mới"}
      description={isEdit ? "Cập nhật thông tin tài khoản người dùng." : "Tạo tài khoản mới cho Học sinh, Giáo viên hoặc Admin."}
      maxWidth="3xl"
      footer={
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="rounded-xl font-bold h-12 px-6"
          >
            Hủy bỏ
          </Button>
          <Button
            type="submit"
            form="user-form"
            disabled={loading}
            className="bg-slate-900 text-white hover:bg-slate-800 rounded-xl font-black h-12 px-8 shadow-lg transition-all"
          >
            {loading ? (
              <Spinner className="mr-2 h-4 w-4" />
            ) : isEdit ? (
              <Save className="mr-2 h-4 w-4" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            {isEdit ? "Cập nhật" : "Tạo mới"}
          </Button>
        </DialogFooter>
      }
    >
      <form id="user-form" onSubmit={handleSubmit} className="space-y-6">
        {/* Role Selector */}
        <div className="space-y-2">
          <Label>Vai trò hệ thống</Label>
          <div className="grid grid-cols-3 gap-3">
             {[
               { id: "STUDENT", label: "Học sinh", icon: GraduationCap, color: "sky" },
               { id: "TEACHER", label: "Giáo viên", icon: UserIcon, color: "orange" },
               { id: "ADMIN", label: "Quản trị", icon: Shield, color: "red" }
             ].map((r) => (
               <button
                 key={r.id}
                 type="button"
                 onClick={() => setRole(r.id as any)}
                 className={cn(
                   "flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all gap-2",
                   role === r.id 
                    ? `border-${r.color}-500 bg-${r.color}-50 text-${r.color}-700 ring-4 ring-${r.color}-50` 
                    : "border-slate-100 text-slate-400 hover:border-slate-200"
                 )}
               >
                 <r.icon size={20} />
                 <span className="text-[10px] font-black uppercase tracking-widest">{r.label}</span>
               </button>
             ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="username">Tên đăng nhập / Username</Label>
            <Input
              id="username"
              placeholder="VD: hs_6a001, cotrang..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isEdit}
              className="h-12 bg-slate-50 border-slate-200 rounded-xl font-bold"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayName">Họ và tên</Label>
            <Input
              id="displayName"
              placeholder="VD: Nguyễn Văn A"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="h-12 bg-slate-50 border-slate-200 rounded-xl font-bold"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email (Tùy chọn)</Label>
            <Input
              id="email"
              type="email"
              placeholder="example@school.vn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 bg-slate-50 border-slate-200 rounded-xl font-bold"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{isEdit ? "Mật khẩu mới (Để trống nếu không đổi)" : "Mật khẩu"}</Label>
            <Input
              id="password"
              type="password"
              placeholder={isEdit ? "Nhập mật khẩu mới..." : "Nhập mật khẩu..."}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 bg-slate-50 border-slate-200 rounded-xl font-bold"
              required={!isEdit}
            />
          </div>
        </div>

        {/* Role-Specific Fields */}
        <AnimatePresence mode="wait">
          {role === "STUDENT" && (
            <motion.div
              key="student-fields"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4 p-6 bg-sky-50/50 rounded-[2rem] border border-sky-100"
            >
              <Label className="text-sky-700 font-black uppercase tracking-widest text-[10px]">Thông tin Học sinh</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label htmlFor="classId" className="text-[10px]">Lớp học {grade > 0 && `(Khối ${grade})`}</Label>
                    <div className="space-y-2">
                      <Input 
                        placeholder="Tìm lớp..." 
                        value={classSearch} 
                        onChange={(e) => setClassSearch(e.target.value)}
                        className="h-9 text-xs bg-white/50 border-sky-100"
                      />
                      <select
                        id="classId"
                        value={classId}
                        onChange={(e) => handleClassChange(e.target.value)}
                        className="w-full h-11 bg-white border border-sky-200 rounded-xl px-4 font-bold text-slate-700 outline-none focus:border-sky-500"
                      >
                        <option value="">-- Chọn lớp --</option>
                        {filteredClasses.map((c) => (
                          <option key={c.id} value={c.id}>{c.name} ({c.academicYear})</option>
                        ))}
                      </select>
                    </div>
                 </div>
                 <div className="space-y-2">
                    <Label htmlFor="studentCode" className="text-[10px]">Mã học sinh</Label>
                    <Input
                      id="studentCode"
                      placeholder="VD: HS6A001"
                      value={studentCode}
                      onChange={(e) => setStudentCode(e.target.value)}
                      className="h-11 bg-white border-sky-200 rounded-xl font-bold uppercase"
                    />
                 </div>
              </div>
            </motion.div>
          )}

          {role === "TEACHER" && (
            <motion.div
              key="teacher-fields"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4 p-6 bg-orange-50/50 rounded-[2rem] border border-orange-100"
            >
              <Label className="text-orange-700 font-black uppercase tracking-widest text-[10px]">Thông tin Giáo viên</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label htmlFor="employeeCode" className="text-[10px]">Mã nhân viên</Label>
                    <Input
                      id="employeeCode"
                      placeholder="VD: GV001"
                      value={employeeCode}
                      onChange={(e) => setEmployeeCode(e.target.value)}
                      className="h-11 bg-white border-orange-200 rounded-xl font-bold uppercase"
                    />
                 </div>
                 <div className="space-y-2">
                    <Label htmlFor="subject" className="text-[10px]">Môn giảng dạy</Label>
                    <Input
                      id="subject"
                      placeholder="VD: Khoa học tự nhiên"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="h-11 bg-white border-orange-200 rounded-xl font-bold"
                    />
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Status */}
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <div className="space-y-0.5">
            <Label className="text-slate-900">Trạng thái tài khoản</Label>
            <p className="text-[10px] font-medium text-slate-500">
              Tài khoản bị khóa sẽ không thể đăng nhập vào hệ thống.
            </p>
          </div>
          <select 
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold outline-none"
          >
            <option value="ACTIVE">Hoạt động</option>
            <option value="SUSPENDED">Tạm khóa</option>
          </select>
        </div>
      </form>
    </ResponsiveModal>
  )
}

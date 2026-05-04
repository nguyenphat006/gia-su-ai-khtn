import * as React from "react"
import {
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Spinner from "@/components/ui/Spinner"
import { adminClassService } from "../services/class.service"
import { Plus, Save } from "lucide-react"
import { ResponsiveModal } from "@/components/ui/ResponsiveModal"
import { toast } from "sonner"

interface ClassFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  classData?: any // If provided, we are in Edit mode
}

export default function ClassFormModal({
  isOpen,
  onClose,
  onSuccess,
  classData,
}: ClassFormModalProps) {
  const isEdit = !!classData
  const [loading, setLoading] = React.useState(false)
  const [code, setCode] = React.useState("")
  const [name, setName] = React.useState("")
  const [grade, setGrade] = React.useState("6")
  const [academicYear, setAcademicYear] = React.useState("2025-2026")

  React.useEffect(() => {
    if (isOpen) {
      if (classData) {
        setCode(classData.code)
        setName(classData.name)
        setGrade(String(classData.grade))
        setAcademicYear(classData.academicYear)
      } else {
        setCode("")
        setName("")
        setGrade("6")
        setAcademicYear("2025-2026")
      }
    }
  }, [isOpen, classData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim() || !name.trim() || !grade || !academicYear.trim()) return

    setLoading(true)
    try {
      const payload = {
        code: code.trim(),
        name: name.trim(),
        grade: Number(grade),
        academicYear: academicYear.trim(),
      }

      if (isEdit) {
        await adminClassService.updateClass(classData.id, payload)
        toast.success("Cập nhật lớp học thành công!")
      } else {
        await adminClassService.createClass(payload)
        toast.success("Tạo lớp học mới thành công!")
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
      title={isEdit ? "Chỉnh sửa lớp học" : "Thêm lớp học mới"}
      description={isEdit ? "Cập nhật thông tin chi tiết cho lớp học này." : "Khởi tạo một lớp học mới trong hệ thống."}
      maxWidth="xl"
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
            form="class-form"
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
      <form id="class-form" onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="code">Mã lớp</Label>
          <Input
            id="code"
            placeholder="VD: 6A1, 9A10..."
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="h-12 bg-slate-50/50 border-slate-200 rounded-xl font-bold uppercase"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">Tên lớp hiển thị</Label>
          <Input
            id="name"
            placeholder="VD: Lớp 6A1 - Sáng"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-12 bg-slate-50/50 border-slate-200 rounded-xl font-bold"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="grade">Khối lớp</Label>
            <select
              id="grade"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className="w-full h-12 bg-slate-50/50 border-2 border-slate-100 rounded-xl px-4 font-bold text-slate-700 outline-none focus:border-sky-500 transition-all"
            >
              <option value="6">Khối 6</option>
              <option value="7">Khối 7</option>
              <option value="8">Khối 8</option>
              <option value="9">Khối 9</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="academicYear">Niên khóa</Label>
            <Input
              id="academicYear"
              placeholder="VD: 2025-2026"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              className="h-12 bg-slate-50/50 border-slate-200 rounded-xl font-bold"
              required
            />
          </div>
        </div>
      </form>
    </ResponsiveModal>
  )
}

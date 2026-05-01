import * as React from "react"
import {
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import Spinner from "@/components/ui/Spinner"
import { adminRevisionService } from "../services/revision.service"
import { Plus, Save } from "lucide-react"
import { ResponsiveModal } from "@/components/ui/ResponsiveModal"
import { toast } from "sonner"

interface MindmapFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  mindmap?: any
}

export default function MindmapFormModal({
  isOpen,
  onClose,
  onSuccess,
  mindmap,
}: MindmapFormModalProps) {
  const isEdit = !!mindmap
  const [loading, setLoading] = React.useState(false)
  
  const [grade, setGrade] = React.useState("6")
  const [topic, setTopic] = React.useState("")
  const [title, setTitle] = React.useState("")
  const [markdown, setMarkdown] = React.useState("")

  React.useEffect(() => {
    if (isOpen) {
      if (mindmap) {
        setGrade(String(mindmap.grade))
        setTopic(mindmap.topic)
        setTitle(mindmap.title)
        setMarkdown(mindmap.markdown || "")
      } else {
        setGrade("6")
        setTopic("")
        setTitle("")
        setMarkdown("")
      }
    }
  }, [isOpen, mindmap])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!topic.trim() || !title.trim() || !markdown.trim()) {
        toast.error("Vui lòng điền đầy đủ thông tin sơ đồ")
        return
    }

    setLoading(true)
    try {
      const data = {
        grade: Number(grade),
        topic,
        title,
        markdown,
        isActive: true
      }

      await adminRevisionService.createMindmap(data)
      
      toast.success(isEdit ? "Cập nhật sơ đồ thành công!" : "Thêm sơ đồ mới thành công!")
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
      title={isEdit ? "Chỉnh sửa sơ đồ" : "Thêm sơ đồ mới"}
      description="Quản lý cấu trúc sơ đồ tư duy (Markdown/Mermaid)."
      maxWidth="3xl"
      footer={
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="ghost" onClick={onClose} className="rounded-xl font-bold h-12 px-6">
            Hủy bỏ
          </Button>
          <Button
            type="submit"
            form="mindmap-form"
            disabled={loading}
            className="bg-slate-900 text-white hover:bg-slate-800 rounded-xl font-black h-12 px-8 shadow-lg transition-all"
          >
            {loading ? <Spinner className="mr-2 h-4 w-4" /> : isEdit ? <Save className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
            {isEdit ? "Cập nhật" : "Lưu sơ đồ"}
          </Button>
        </DialogFooter>
      }
    >
      <form id="mindmap-form" onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Khối lớp</Label>
            <select 
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className="w-full h-12 bg-slate-50 border-2 border-slate-100 rounded-xl px-4 font-bold text-slate-700 outline-none focus:border-sky-500 transition-all"
            >
              <option value="6">Lớp 6</option>
              <option value="7">Lớp 7</option>
              <option value="8">Lớp 8</option>
              <option value="9">Lớp 9</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="topic">Chủ đề (Topic)</Label>
            <Input
              id="topic"
              placeholder="VD: Quang hợp ở thực vật..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="h-12 bg-slate-50 border-slate-200 rounded-xl font-bold"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="title">Tiêu đề sơ đồ</Label>
          <Input
            id="title"
            placeholder="VD: Tổng quan về quá trình quang hợp"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-12 bg-slate-50 border-slate-200 rounded-xl font-bold"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="markdown">Cấu trúc Sơ đồ (Markdown/Mermaid)</Label>
          <Textarea
            id="markdown"
            placeholder="Nhập mã sơ đồ tại đây..."
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            className="min-h-[250px] bg-slate-50 border-slate-200 rounded-2xl p-4 text-xs font-mono"
            required
          />
        </div>
      </form>
    </ResponsiveModal>
  )
}

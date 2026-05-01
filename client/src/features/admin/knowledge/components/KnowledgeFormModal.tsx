import * as React from "react"
import {
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import Spinner from "@/components/ui/Spinner"
import { KnowledgeDocument } from "../types"
import { knowledgeService } from "../services/knowledge.service"
import { Plus, Save, X } from "lucide-react"
import { ResponsiveModal } from "@/components/ui/ResponsiveModal"
import { toast } from "sonner"

interface KnowledgeFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  document?: KnowledgeDocument // If provided, we are in Edit mode
}

export default function KnowledgeFormModal({
  isOpen,
  onClose,
  onSuccess,
  document,
}: KnowledgeFormModalProps) {
  const isEdit = !!document
  const [loading, setLoading] = React.useState(false)
  const [title, setTitle] = React.useState("")
  const [content, setContent] = React.useState("")
  const [tags, setTags] = React.useState<string[]>([])
  const [tagInput, setTagInput] = React.useState("")
  const [isActive, setIsActive] = React.useState(true)

  React.useEffect(() => {
    if (isOpen) {
      if (document) {
        setTitle(document.title)
        setContent(document.content)
        setTags(document.tags || [])
        setIsActive(document.isActive)
      } else {
        setTitle("")
        setContent("")
        setTags([])
        setIsActive(true)
      }
    }
  }, [isOpen, document])

  const handleAddTag = () => {
    const val = tagInput.trim()
    if (val && !tags.includes(val)) {
      setTags([...tags, val])
      setTagInput("")
    }
  }

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) return

    setLoading(true)
    try {
      if (isEdit && document) {
        await knowledgeService.updateDocument(document.id, {
          title,
          content,
          tags,
          isActive,
        })
      } else {
        await knowledgeService.createDocument({
          title,
          content,
          tags,
          isActive,
        })
      }
      onSuccess()
      toast.success(isEdit ? "Cập nhật tài liệu thành công!" : "Tạo tài liệu mới thành công!")
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
      title={isEdit ? "Chỉnh sửa tài liệu" : "Thêm tài liệu mới"}
      description={isEdit 
        ? "Cập nhật thông tin chi tiết cho tài liệu tri thức này." 
        : "Khởi tạo dữ liệu tri thức mới cho trợ lý ảo AI."}
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
            form="knowledge-form"
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
            {isEdit ? "Cập nhật tài liệu" : "Tạo tài liệu"}
          </Button>
        </DialogFooter>
      }
    >
      <form id="knowledge-form" onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">Tiêu đề tài liệu</Label>
          <Input
            id="title"
            placeholder="VD: Chương 1: Thành phần của tế bào..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-12 bg-slate-50/50 border-slate-200 rounded-xl font-bold"
            required
          />
        </div>

        {/* Content */}
        <div className="space-y-2">
          <Label htmlFor="content">Nội dung chi tiết</Label>
          <Textarea
            id="content"
            placeholder="Nhập nội dung kiến thức chuyên môn tại đây..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[200px] bg-slate-50/50 border-slate-200 rounded-2xl p-4 text-sm leading-relaxed"
            required
          />
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <Label>Nhãn (Tags)</Label>
          <div className="flex flex-wrap gap-2 mb-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-sky-50 text-sky-600 text-[10px] font-black uppercase border border-sky-100"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:text-sky-800"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Thêm nhãn mới..."
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  handleAddTag()
                }
              }}
              className="h-10 bg-slate-50/50 border-slate-200 rounded-xl text-xs font-bold"
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleAddTag}
              className="h-10 rounded-xl border-slate-200"
            >
              Thêm
            </Button>
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <div className="space-y-0.5">
            <Label className="text-slate-900">Trạng thái hoạt động</Label>
            <p className="text-[10px] font-medium text-slate-500">
              Tài liệu sẽ được AI sử dụng nếu ở trạng thái hoạt động.
            </p>
          </div>
          <Switch
            checked={isActive}
            onCheckedChange={setIsActive}
          />
        </div>
      </form>
    </ResponsiveModal>
  )
}

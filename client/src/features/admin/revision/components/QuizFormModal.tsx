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
import { Plus, Save, X } from "lucide-react"
import { ResponsiveModal } from "@/components/ui/ResponsiveModal"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface QuizFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  quiz?: any // If provided, we are in Edit mode
}

export default function QuizFormModal({
  isOpen,
  onClose,
  onSuccess,
  quiz,
}: QuizFormModalProps) {
  const isEdit = !!quiz
  const [loading, setLoading] = React.useState(false)
  
  const [grade, setGrade] = React.useState("6")
  const [topic, setTopic] = React.useState("")
  const [type, setType] = React.useState("MULTIPLE_CHOICE")
  const [difficulty, setDifficulty] = React.useState("Trung bình")
  const [content, setContent] = React.useState("")
  const [options, setOptions] = React.useState<string[]>(["", "", "", ""])
  const [correctAnswer, setCorrectAnswer] = React.useState("")
  const [explanation, setExplanation] = React.useState("")

  React.useEffect(() => {
    if (isOpen) {
      if (quiz) {
        setGrade(String(quiz.grade))
        setTopic(quiz.topic)
        setType(quiz.type)
        setDifficulty(quiz.difficulty)
        setContent(quiz.content)
        setOptions(quiz.options || ["", "", "", ""])
        setCorrectAnswer(quiz.correctAnswer)
        setExplanation(quiz.explanation || "")
      } else {
        setGrade("6")
        setTopic("")
        setType("MULTIPLE_CHOICE")
        setDifficulty("Trung bình")
        setContent("")
        setOptions(["", "", "", ""])
        setCorrectAnswer("")
        setExplanation("")
      }
    }
  }, [isOpen, quiz])

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options]
    newOptions[index] = value
    setOptions(newOptions)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!topic.trim() || !content.trim() || !correctAnswer.trim()) {
        toast.error("Vui lòng điền đầy đủ các trường bắt buộc")
        return
    }

    setLoading(true)
    try {
      const data = {
        grade: Number(grade),
        topic,
        type,
        difficulty,
        content,
        options: type === "MULTIPLE_CHOICE" ? options : null,
        correctAnswer,
        explanation,
        isActive: true
      }

      if (isEdit && quiz?.id) {
        await adminRevisionService.updateQuestion(quiz.id, data)
      } else {
        await adminRevisionService.createQuestion(data)
      }
      
      toast.success(isEdit ? "Cập nhật câu hỏi thành công!" : "Thêm câu hỏi mới thành công!")
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
      title={isEdit ? "Chỉnh sửa câu hỏi" : "Thêm câu hỏi mới"}
      description="Quản lý nội dung ngân hàng câu hỏi ôn tập."
      maxWidth="3xl"
      footer={
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="ghost" onClick={onClose} className="rounded-xl font-bold h-12 px-6">
            Hủy bỏ
          </Button>
          <Button
            type="submit"
            form="quiz-form"
            disabled={loading}
            className="bg-slate-900 text-white hover:bg-slate-800 rounded-xl font-black h-12 px-8 shadow-lg transition-all"
          >
            {loading ? <Spinner className="mr-2 h-4 w-4" /> : isEdit ? <Save className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
            {isEdit ? "Cập nhật" : "Lưu vào Bank"}
          </Button>
        </DialogFooter>
      }
    >
      <form id="quiz-form" onSubmit={handleSubmit} className="space-y-6">
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
            <Label>Độ khó</Label>
            <select 
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full h-12 bg-slate-50 border-2 border-slate-100 rounded-xl px-4 font-bold text-slate-700 outline-none focus:border-sky-500 transition-all"
            >
              <option value="Dễ">Dễ (Biết)</option>
              <option value="Trung bình">Trung bình (Hiểu)</option>
              <option value="Khó">Khó (Vận dụng)</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="topic">Chủ đề bài học</Label>
          <Input
            id="topic"
            placeholder="VD: Chuyển động cơ học..."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="h-12 bg-slate-50 border-slate-200 rounded-xl font-bold"
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Loại câu hỏi</Label>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setType("MULTIPLE_CHOICE")}
              className={cn(
                "flex-1 py-3 rounded-xl border-2 font-bold text-xs uppercase tracking-widest transition-all",
                type === "MULTIPLE_CHOICE" ? "border-sky-500 bg-sky-50 text-sky-700" : "border-slate-100 text-slate-400"
              )}
            >
              Trắc nghiệm
            </button>
            <button
              type="button"
              onClick={() => setType("ESSAY")}
              className={cn(
                "flex-1 py-3 rounded-xl border-2 font-bold text-xs uppercase tracking-widest transition-all",
                type === "ESSAY" ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-slate-100 text-slate-400"
              )}
            >
              Tự luận
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="content">Nội dung câu hỏi</Label>
          <Textarea
            id="content"
            placeholder="Nhập nội dung câu hỏi tại đây..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[100px] bg-slate-50 border-slate-200 rounded-2xl p-4 text-sm font-bold"
            required
          />
        </div>

        {type === "MULTIPLE_CHOICE" && (
          <div className="space-y-4 p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
            <Label className="text-sky-700 font-black uppercase tracking-widest text-[10px]">Các phương án lựa chọn</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {options.map((opt, i) => (
                <div key={i} className="space-y-1">
                   <Label className="text-[9px] font-black text-slate-400 ml-2">Đáp án {String.fromCharCode(65+i)}</Label>
                   <Input 
                     value={opt}
                     onChange={(e) => handleOptionChange(i, e.target.value)}
                     placeholder={`Nhập lựa chọn ${i+1}...`}
                     className="bg-white border-slate-200 rounded-xl"
                   />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="correctAnswer">Đáp án đúng</Label>
          <Input
            id="correctAnswer"
            placeholder={type === "MULTIPLE_CHOICE" ? "Nhập chính xác chuỗi đáp án đúng..." : "Nhập nội dung đáp án chuẩn..."}
            value={correctAnswer}
            onChange={(e) => setCorrectAnswer(e.target.value)}
            className="h-12 bg-emerald-50 border-emerald-100 rounded-xl font-bold text-emerald-700"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="explanation">Lời giải chi tiết (Giải thích)</Label>
          <Textarea
            id="explanation"
            placeholder="Giải thích vì sao đáp án đó là đúng..."
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            className="min-h-[100px] bg-slate-50 border-slate-200 rounded-2xl p-4 text-xs italic"
          />
        </div>
      </form>
    </ResponsiveModal>
  )
}

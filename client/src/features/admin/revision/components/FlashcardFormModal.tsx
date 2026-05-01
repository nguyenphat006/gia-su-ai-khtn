import * as React from "react"
import {
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Spinner from "@/components/ui/Spinner"
import { adminRevisionService } from "../services/revision.service"
import { Plus, Save, Trash2, X } from "lucide-react"
import { ResponsiveModal } from "@/components/ui/ResponsiveModal"
import { toast } from "sonner"

interface FlashcardFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  deck?: any
}

export default function FlashcardFormModal({
  isOpen,
  onClose,
  onSuccess,
  deck,
}: FlashcardFormModalProps) {
  const isEdit = !!deck
  const [loading, setLoading] = React.useState(false)
  
  const [grade, setGrade] = React.useState("6")
  const [topic, setTopic] = React.useState("")
  const [title, setTitle] = React.useState("")
  const [cards, setCards] = React.useState<any[]>([{ front: "", back: "" }])

  React.useEffect(() => {
    if (isOpen) {
      if (deck) {
        setGrade(String(deck.grade))
        setTopic(deck.topic)
        setTitle(deck.title)
        setCards(deck.cards || [{ front: "", back: "" }])
      } else {
        setGrade("6")
        setTopic("")
        setTitle("")
        setCards([{ front: "", back: "" }])
      }
    }
  }, [isOpen, deck])

  const addCard = () => setCards([...cards, { front: "", back: "" }])
  const removeCard = (index: number) => {
    if (cards.length > 1) {
        setCards(cards.filter((_, i) => i !== index))
    }
  }
  const updateCard = (index: number, side: "front" | "back", value: string) => {
    const newCards = [...cards]
    newCards[index][side] = value
    setCards(newCards)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!topic.trim() || !title.trim() || cards.some(c => !c.front.trim() || !c.back.trim())) {
        toast.error("Vui lòng điền đầy đủ thông tin bộ thẻ")
        return
    }

    setLoading(true)
    try {
      const data = {
        grade: Number(grade),
        topic,
        title,
        cards,
        isActive: true
      }

      await adminRevisionService.createFlashcard(data)
      
      toast.success(isEdit ? "Cập nhật bộ thẻ thành công!" : "Thêm bộ thẻ mới thành công!")
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
      title={isEdit ? "Chỉnh sửa bộ thẻ" : "Thêm bộ thẻ mới"}
      description="Quản lý các thẻ ghi nhớ (Flashcards) dành cho học sinh."
      maxWidth="3xl"
      footer={
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="ghost" onClick={onClose} className="rounded-xl font-bold h-12 px-6">
            Hủy bỏ
          </Button>
          <Button
            type="submit"
            form="flashcard-form"
            disabled={loading}
            className="bg-slate-900 text-white hover:bg-slate-800 rounded-xl font-black h-12 px-8 shadow-lg transition-all"
          >
            {loading ? <Spinner className="mr-2 h-4 w-4" /> : isEdit ? <Save className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
            {isEdit ? "Cập nhật" : "Lưu bộ thẻ"}
          </Button>
        </DialogFooter>
      }
    >
      <form id="flashcard-form" onSubmit={handleSubmit} className="space-y-6">
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
              placeholder="VD: Cấu tạo tế bào..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="h-12 bg-slate-50 border-slate-200 rounded-xl font-bold"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="title">Tiêu đề hiển thị</Label>
          <Input
            id="title"
            placeholder="VD: Các thành phần chính của tế bào"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-12 bg-slate-50 border-slate-200 rounded-xl font-bold"
            required
          />
        </div>

        <div className="space-y-4">
           <div className="flex items-center justify-between">
              <Label className="text-orange-600 font-black uppercase tracking-widest text-[10px]">Danh sách các thẻ ({cards.length})</Label>
              <Button type="button" onClick={addCard} variant="outline" size="sm" className="h-8 rounded-lg border-orange-200 text-orange-600 font-bold text-[10px] uppercase">
                <Plus size={14} className="mr-1" /> Thêm thẻ mới
              </Button>
           </div>
           
           <div className="space-y-3">
              {cards.map((card, i) => (
                <div key={i} className="group relative flex flex-col md:flex-row gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 transition-all hover:border-orange-200">
                    <div className="flex-1 space-y-1">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Mặt trước (Hỏi)</span>
                        <Input 
                          value={card.front}
                          onChange={(e) => updateCard(i, "front", e.target.value)}
                          placeholder="Câu hỏi hoặc thuật ngữ..."
                          className="bg-white border-slate-200 rounded-xl h-10 text-xs"
                        />
                    </div>
                    <div className="flex-1 space-y-1">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Mặt sau (Trả lời)</span>
                        <Input 
                          value={card.back}
                          onChange={(e) => updateCard(i, "back", e.target.value)}
                          placeholder="Đáp án hoặc định nghĩa..."
                          className="bg-white border-slate-200 rounded-xl h-10 text-xs font-bold text-orange-700"
                        />
                    </div>
                    <button 
                      type="button"
                      onClick={() => removeCard(i)}
                      className="absolute -right-2 -top-2 w-6 h-6 bg-white border border-red-100 text-red-400 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:text-red-600"
                    >
                        <X size={12} />
                    </button>
                </div>
              ))}
           </div>
        </div>
      </form>
    </ResponsiveModal>
  )
}

import * as React from "react"
import {
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import Spinner from "@/components/ui/Spinner"
import { SystemConfig } from "../types"
import { systemService } from "../services/system.service"
import { Plus, Save } from "lucide-react"
import { ResponsiveModal } from "@/components/ui/ResponsiveModal"
import { toast } from "sonner"

interface SystemConfigModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  config?: SystemConfig // If provided, we are in Edit mode
}

export default function SystemConfigModal({
  isOpen,
  onClose,
  onSuccess,
  config,
}: SystemConfigModalProps) {
  const isEdit = !!config
  const [loading, setLoading] = React.useState(false)
  const [key, setKey] = React.useState("")
  const [value, setValue] = React.useState("")

  React.useEffect(() => {
    if (isOpen) {
      if (config) {
        setKey(config.key)
        setValue(config.value)
      } else {
        setKey("")
        setValue("")
      }
    }
  }, [isOpen, config])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!key.trim() || value === undefined) return

    setLoading(true)
    try {
      if (isEdit) {
        await systemService.updateConfig(key, value)
      } else {
        await systemService.createConfig(key, value)
      }
      onSuccess()
      toast.success(isEdit ? "Cập nhật cấu hình thành công!" : "Tạo cấu hình mới thành công!")
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
      title={isEdit ? "Chỉnh sửa cấu hình" : "Thêm cấu hình mới"}
      description={isEdit 
        ? `Cập nhật giá trị cho khóa cấu hình: ${key}` 
        : "Thêm một cặp Khóa - Giá trị mới vào cấu hình hệ thống."}
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
            form="system-config-form"
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
      <form id="system-config-form" onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="key">Khóa cấu hình (Key)</Label>
          <Input
            id="key"
            placeholder="VD: MAX_CHAT_SESSION"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            disabled={isEdit}
            className="h-12 bg-slate-50/50 border-slate-200 rounded-xl font-black uppercase tracking-widest text-xs"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="value">Giá trị (Value)</Label>
          <Textarea
            id="value"
            placeholder="Nhập giá trị cấu hình..."
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="min-h-[150px] bg-slate-50/50 border-slate-200 rounded-2xl p-4 text-sm font-medium"
            required
          />
        </div>
      </form>
    </ResponsiveModal>
  )
}

import SystemConfigIndex from "@/features/admin/system-config/SystemConfig-Index";

export default function SystemConfigPage() {
  return (
    <div className="max-w-7xl mx-auto pb-10">
      <div className="flex flex-col gap-1 mb-8">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Cấu hình hệ thống</h2>
        <p className="text-slate-500 font-medium">Tùy chỉnh các tham số vận hành và Prompt cho Trợ lý AI.</p>
      </div>
      
      <SystemConfigIndex />
    </div>
  );
}

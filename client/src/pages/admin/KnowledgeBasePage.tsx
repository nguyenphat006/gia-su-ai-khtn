import KnowledgeIndex from "@/features/admin/knowledge/Knowledge-Index";

export default function KnowledgeBasePage() {
  return (
    <div className="max-w-7xl mx-auto pb-10">
      <div className="flex flex-col gap-1 mb-8">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Kho tri thức AI</h2>
        <p className="text-slate-500 font-medium">Quản lý và cập nhật dữ liệu đào tạo cho trợ lý ảo của bạn.</p>
      </div>
      
      <KnowledgeIndex />
    </div>
  );
}

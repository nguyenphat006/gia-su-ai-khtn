import { Database } from "lucide-react";
import { useKnowledgeBase } from "./hooks/useKnowledgeBase";
import { KnowledgeManager } from "./components/KnowledgeManager";
import { SchoolConfig } from "./components/SchoolConfig";

interface TeacherFeatureProps {
  schoolLogo: string | null;
  onLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isUploadingLogo: boolean;
}

export default function TeacherFeature({ schoolLogo, onLogoUpload, isUploadingLogo }: TeacherFeatureProps) {
  const { isUploading, uploadStatus, documents, handleFileUpload, clearDatabase } = useKnowledgeBase();

  return (
    <div className="max-w-4xl mx-auto space-y-8 custom-scrollbar">
      <SchoolConfig 
        schoolLogo={schoolLogo}
        onLogoUpload={onLogoUpload}
        isUploadingLogo={isUploadingLogo}
      />

      <KnowledgeManager 
        isUploading={isUploading}
        uploadStatus={uploadStatus}
        documents={documents}
        handleFileUpload={handleFileUpload}
        clearDatabase={clearDatabase}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard label="Tri thức đã nạp" value={`${(documents.reduce((acc, d) => acc + (d.content?.length || 0), 0) / 1024).toFixed(1)} KB`} color="sky" />
          <StatCard label="Tổng tài liệu" value={documents.length.toString()} color="blue" />
          <StatCard label="Học sinh online" value="48" color="indigo" />
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  const colors: Record<string, string> = {
    sky: "text-sky-600 bg-sky-50",
    blue: "text-blue-600 bg-blue-50",
    indigo: "text-indigo-600 bg-indigo-50"
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-sky-50 card-shadow flex items-center justify-between">
       <div>
          <p className="text-xs font-black text-black uppercase tracking-widest mb-1">{label}</p>
          <p className={`text-2xl font-display font-extrabold ${colors[color].split(" ")[0]}`}>{value}</p>
       </div>
       <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${colors[color].split(" ")[1]} ${colors[color].split(" ")[0]}`}>
          <Database size={24} />
       </div>
    </div>
  );
}

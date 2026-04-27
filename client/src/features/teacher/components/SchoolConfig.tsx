import { Image as ImageIcon, Loader2, Upload, CheckCircle } from "lucide-react";

interface SchoolConfigProps {
  schoolLogo: string | null;
  onLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isUploadingLogo: boolean;
}

export function SchoolConfig({ schoolLogo, onLogoUpload, isUploadingLogo }: SchoolConfigProps) {
  return (
    <div className="bg-white rounded-3xl p-8 border border-sky-100 card-shadow">
       <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-sky-50 rounded-2xl flex items-center justify-center text-sky-600 font-bold border border-sky-100">
             <ImageIcon size={24} />
          </div>
          <h3 className="font-display font-bold text-sky-900 text-xl tracking-tight">Cập Nhật Logo Trường</h3>
       </div>
       <p className="text-sm text-black mb-6 leading-relaxed font-bold">
          Hãy tải lên Logo chính thức của trường. Sau khi tải lên, hệ thống sẽ tự động cập nhật cho toàn bộ trang web.
       </p>
       <div className="flex items-center gap-6">
          <div className="w-32 h-32 rounded-2xl border-4 border-sky-50 shadow-sm flex items-center justify-center bg-white overflow-hidden shrink-0 p-2">
             {isUploadingLogo ? (
                <Loader2 className="animate-spin text-sky-600" size={24} />
             ) : schoolLogo ? (
                <img src={schoolLogo} alt="School Logo" className="w-full h-full object-contain" />
             ) : (
                <span className="text-xs font-black text-black">Chưa có</span>
             )}
          </div>
          <div className="flex flex-col gap-3">
             <label className="bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 px-6 rounded-xl cursor-pointer transition-all shadow-lg flex items-center gap-2 w-fit">
                <Upload size={18} />
                {schoolLogo ? "Thay đổi Logo mới" : "Tải lên Logo ngay"}
                <input 
                   type="file" 
                   className="hidden" 
                   accept="image/*" 
                   onChange={onLogoUpload} 
                   disabled={isUploadingLogo}
                />
             </label>
             {schoolLogo && (
                <div className="bg-green-50 text-green-700 font-bold py-2 px-4 rounded-xl border border-green-100 flex items-center gap-2 text-[10px] uppercase italic">
                   <CheckCircle size={14} />
                   Đã thiết lập logo thành công
                </div>
             )}
          </div>
       </div>
    </div>
  );
}

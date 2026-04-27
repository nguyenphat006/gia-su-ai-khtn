export default function Footer() {
  return (
    <footer className="hidden md:flex flex-col md:flex-row items-center justify-between gap-4 text-[10px] text-black font-normal tracking-widest uppercase px-6 py-4 shrink-0 bg-white/50 border-t border-sky-100 max-w-[1400px] mx-auto w-full">
      <p className="text-center md:text-left">
        © 2026 GIA SƯ AI KHTN TRƯỜNG THCS PHƯỚC TÂN 3 – Thiết kế và phát triển
        bởi cô Vũ Thị Thu Trang
      </p>
      <div className="flex items-center space-x-6">
        <span className="flex items-center">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]"></div>
          Hệ thống ổn định
        </span>
        <span className="opacity-60">Phiên bản v2.0.1</span>
      </div>
    </footer>
  );
}

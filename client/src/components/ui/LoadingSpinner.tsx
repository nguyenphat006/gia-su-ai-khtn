import { Loader2 } from "lucide-react";
import { motion } from "motion/react";

export default function LoadingSpinner() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-[#F0FDFA] flex items-center justify-center"
    >
      <div className="text-center">
        <Loader2 className="animate-spin text-sky-600 mx-auto mb-4" size={48} />
        <p className="text-sky-900 font-bold text-sm tracking-widest uppercase">
          Đang tải...
        </p>
      </div>
    </motion.div>
  );
}

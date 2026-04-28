import { motion } from "motion/react";
import LoginForm from "./components/LoginForm";
import { SCHOOL_LOGO_URL } from "@/hooks/useAuth";
import type { LoginInput } from "./types";

interface AuthFeatureProps {
  onLogin: (input: LoginInput) => Promise<unknown>;
}

export default function AuthFeature({
  onLogin,
}: AuthFeatureProps) {
  return (
    <div className="min-h-screen bg-sky-600 flex items-center justify-center p-6 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-sky-500 to-sky-700">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-5xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden grid lg:grid-cols-[1.1fr_1fr]"
      >
        {/* Left Column - Branding & School Info */}
        <div className="bg-[linear-gradient(160deg,#0f4c81_0%,#0369a1_45%,#38bdf8_100%)] text-white p-12 flex flex-col items-center justify-center text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center"
          >
            {/* Enlarged Logo Container */}
            <div className="w-44 h-44 bg-white/10 border-2 border-white/20 rounded-[2.5rem] flex items-center justify-center backdrop-blur shadow-2xl mb-8">
              <img
                src={SCHOOL_LOGO_URL}
                alt="School Logo"
                className="w-32 h-auto object-contain"
              />
            </div>

            <h1 className="text-4xl font-display font-black tracking-tight leading-none mb-4 uppercase">
              Gia Sư AI KHTN
            </h1>
            
            <div className="h-1.5 w-16 bg-white/30 rounded-full mb-6"></div>
            
            <p className="text-base leading-7 text-white/90 max-w-xs font-medium">
              Hệ thống học tập thông minh dành cho học sinh <br/>
              <span className="text-white font-bold">THCS Phước Tân 3</span>
            </p>
          </motion.div>
        </div>

        {/* Right Column - Login Form */}
        <div className="p-8 lg:p-12 flex flex-col justify-center bg-white">
          <LoginForm onLogin={onLogin} />
        </div>
      </motion.div>
    </div>
  );
}

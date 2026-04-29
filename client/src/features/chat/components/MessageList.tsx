import { useRef, useEffect } from "react";
import { Bot, Loader2, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { cn, processLaTeX } from "@/lib/utils";
import { Message } from "../types";

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
}

export default function MessageList({ messages, isLoading }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <div className="h-full overflow-y-auto space-y-6 pb-12 pt-6 px-3 sm:px-6 custom-scrollbar">
      {messages.length === 0 && !isLoading && (
        <div className="h-full flex flex-col items-center justify-center text-center opacity-30 select-none">
          <Bot size={64} className="mb-4 text-sky-500" />
          <p className="font-black uppercase tracking-[0.3em] text-sm text-slate-900">Bắt đầu thảo luận khoa học</p>
          <p className="text-xs font-bold mt-2 text-slate-600">Hệ thống AI đã sẵn sàng hỗ trợ em</p>
        </div>
      )}

      {messages.map((msg, idx) => (
        <div key={idx} className={cn(
          "flex gap-3 sm:gap-4 group animate-in fade-in slide-in-from-bottom-2 duration-300",
          msg.role === "user" ? "flex-row-reverse" : "flex-row"
        )}>
          {/* Avatar Area */}
          <div className={cn(
            "w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center shrink-0 border-2 shadow-sm transition-transform",
            msg.role === "user" 
              ? "bg-white border-slate-200 text-slate-900" 
              : "bg-sky-600 border-sky-500 text-white"
          )}>
            {msg.role === "user" ? <User size={16} /> : <Bot size={20} />}
          </div>
          
          {/* Content Area */}
          <div className={cn(
            "flex flex-col gap-1.5 max-w-[85%]",
            msg.role === "user" ? "items-end" : "items-start"
          )}>
            <div className={cn(
              "rounded-[1.5rem] p-4 sm:p-5 shadow-sm transition-all border",
              msg.role === "user" 
                ? "bg-white border-slate-100 text-slate-800 rounded-tr-none shadow-slate-200/50" 
                : "bg-sky-50/70 border-sky-100 text-sky-950 rounded-tl-none"
            )}>
              <div className={cn(
                "markdown-body text-[13px] sm:text-[15px] leading-relaxed font-bold",
                msg.role === "user" ? "prose-slate" : "prose-sky message-content"
              )}>
                <ReactMarkdown 
                  remarkPlugins={[remarkMath]} 
                  rehypePlugins={[rehypeKatex]}
                >
                  {processLaTeX(msg.content)}
                </ReactMarkdown>
              </div>
            </div>
            
            <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest px-2">
              {msg.timestamp?.toDate ? msg.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Vừa xong"}
            </span>
          </div>
        </div>
      ))}

      {isLoading && (
        <div className="flex gap-3 sm:gap-4 animate-in fade-in duration-300">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white border-2 border-sky-50 flex items-center justify-center text-sky-400">
             <Loader2 className="animate-spin" size={18} />
          </div>
          <div className="bg-sky-50/50 border border-sky-100 rounded-[1.5rem] rounded-tl-none p-4 sm:p-5 flex items-center gap-3">
             <div className="flex gap-1">
                <span className="w-1 h-1 bg-sky-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-1 h-1 bg-sky-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-1 h-1 bg-sky-400 rounded-full animate-bounce"></span>
             </div>
             <span className="text-[10px] font-black text-sky-600 uppercase tracking-widest">Gia sư đang phân tích...</span>
          </div>
        </div>
      )}
      <div ref={scrollRef} />
    </div>
  );
}

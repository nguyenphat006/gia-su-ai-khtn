import { useRef, useEffect } from "react";
import { Bot, Loader2 } from "lucide-react";
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
    <div className="flex-1 overflow-y-auto space-y-6 pb-32 px-2 custom-scrollbar">
      {messages.map((msg, idx) => (
        <div key={idx} className={cn(
          "flex gap-3 group",
          msg.role === "user" ? "flex-row-reverse" : "flex-row"
        )}>
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center shrink-0 border shadow-sm",
            msg.role === "user" ? "bg-black text-white border-white" : "bg-sky-600 text-white border-sky-500"
          )}>
            {msg.role === "user" ? <span className="text-[10px] font-bold">Tôi</span> : <Bot size={16} />}
          </div>
          
          <div className={cn(
            "max-w-[85%] rounded-2xl p-4 md:p-5 card-shadow",
            msg.role === "user" 
              ? "bg-white text-black font-bold rounded-tr-none border border-slate-100" 
              : "bg-sky-50 text-sky-950 font-bold rounded-tl-none border border-sky-100"
          )}>
            <div className={cn(
              "markdown-body text-sm leading-relaxed",
              msg.role === "user" ? "" : "prose-sky message-content"
            )}>
              <ReactMarkdown 
                remarkPlugins={[remarkMath]} 
                rehypePlugins={[rehypeKatex]}
              >
                {processLaTeX(msg.content)}
              </ReactMarkdown>
            </div>
            <p className={cn(
              "text-[9px] mt-3 opacity-40 font-bold uppercase tracking-wider",
              msg.role === "user" ? "text-right" : "text-left"
            )}>
              {msg.timestamp?.toDate ? msg.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Đang gửi..."}
            </p>
          </div>
        </div>
      ))}
      {isLoading && (
        <div className="flex gap-3 animate-pulse">
          <div className="w-8 h-8 rounded-full bg-sky-100 border border-sky-200" />
          <div className="bg-sky-50 border border-sky-100 rounded-2xl p-5 h-20 w-64 card-shadow flex items-center gap-3">
             <Loader2 className="animate-spin text-sky-600" size={18} />
             <span className="text-xs font-bold text-sky-700">Gia sư đang suy nghĩ...</span>
          </div>
        </div>
      )}
      <div ref={scrollRef} />
    </div>
  );
}

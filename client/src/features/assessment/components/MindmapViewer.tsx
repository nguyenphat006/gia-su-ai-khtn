import { motion } from "motion/react";
import { ArrowLeft, Brain } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { cn, processLaTeX } from "@/lib/utils";
import { MindmapNode, AssessmentMode } from "../types";

function MindmapView({ nodes }: { nodes: MindmapNode[] }) {
  const root = nodes.find(n => !n.parentId);
  if (!root) return null;

  const getDepthColors = (depth: number) => {
    switch (depth) {
      case 0: return { bg: "bg-indigo-600", text: "text-white", border: "border-indigo-400", dot: "bg-indigo-300", line: "border-indigo-200" };
      case 1: return { bg: "bg-sky-50", text: "text-sky-900", border: "border-sky-200", dot: "bg-sky-500", line: "border-sky-100" };
      case 2: return { bg: "bg-teal-50", text: "text-teal-900", border: "border-teal-200", dot: "bg-teal-500", line: "border-teal-100" };
      case 3: return { bg: "bg-orange-50", text: "text-orange-900", border: "border-orange-200", dot: "bg-orange-500", line: "border-orange-100" };
      default: return { bg: "bg-slate-50", text: "text-slate-900", border: "border-slate-200", dot: "bg-slate-500", line: "border-slate-100" };
    }
  };

  const renderNodes = (parentId: string, depth = 0) => {
    const children = nodes.filter(n => n.parentId === parentId);
    if (children.length === 0) return null;
    
    const colors = getDepthColors(depth + 1);
    const parentColors = getDepthColors(depth);

    return (
      <div className={cn("space-y-4 relative", depth > 0 && `ml-6 md:ml-12 border-l-4 ${parentColors.line} pl-6 md:pl-10 mt-6`)}>
        {children.map((node, idx) => (
          <motion.div 
            initial={{ opacity: 0, x: -20, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ delay: idx * 0.1, type: "spring", stiffness: 200 }}
            key={node.id} 
            className="relative"
          >
            {/* Horizontal connection line to the node */}
            {depth > 0 && (
               <div className={`absolute -left-6 md:-left-10 top-1/2 w-6 md:w-10 border-t-4 ${parentColors.line} -translate-y-1/2`} />
            )}
            
            <div className={cn(
               "p-4 md:p-5 rounded-3xl border-2 shadow-lg hover:shadow-xl transition-all flex items-center gap-3 md:gap-4 relative z-10",
               colors.bg, colors.border
            )}>
               <div className={cn("w-3 h-3 rounded-full shrink-0 shadow-inner", colors.dot)} />
               <div className={cn("font-bold text-sm md:text-base leading-snug", colors.text)}>
                  <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{processLaTeX(node.label)}</ReactMarkdown>
               </div>
            </div>
            {renderNodes(node.id, depth + 1)}
          </motion.div>
        ))}
      </div>
    );
  };

  const rootColors = getDepthColors(0);

  return (
    <div className="py-8 overflow-x-auto custom-scrollbar">
       <div className="min-w-[300px] md:min-w-[600px] pb-10 px-4">
         <motion.div 
           initial={{ scale: 0.8, opacity: 0 }}
           animate={{ scale: 1, opacity: 1 }}
           className={cn(
              "px-8 py-6 rounded-[2rem] font-display font-black text-center text-xl md:text-2xl shadow-2xl border-4 mb-4 max-w-sm relative z-10",
              rootColors.bg, rootColors.text, rootColors.border
           )}
         >
            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{processLaTeX(root.label)}</ReactMarkdown>
         </motion.div>
         {renderNodes(root.id)}
       </div>
    </div>
  );
}

interface MindmapViewerProps {
  mindmapNodes: MindmapNode[];
  setMindmapNodes: (nodes: MindmapNode[]) => void;
  topic: string;
  setTopic: (t: string) => void;
  grade: string;
  setGrade: (g: string) => void;
  setMode: (m: AssessmentMode) => void;
  createMindmap: () => void;
}

export function MindmapViewer({
  mindmapNodes, setMindmapNodes, topic, setTopic, grade, setGrade, setMode, createMindmap
}: MindmapViewerProps) {
  return (
    <div className="flex flex-col h-full bg-blue-50/10 rounded-[2.5rem] p-8 border border-blue-100/50">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => { setMode("menu"); setMindmapNodes([]); }}
            className="p-2 hover:bg-white rounded-xl text-blue-600 transition-all border border-blue-100 bg-white/50"
          >
            <ArrowLeft size={20} />
          </button>
          <h3 className="font-display font-black text-blue-900 text-xl tracking-tight uppercase">Mindmap AI</h3>
        </div>
        {mindmapNodes.length > 0 && (
           <button 
             onClick={() => setMindmapNodes([])}
             className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline"
           >
             Vẽ sơ đồ khác
           </button>
        )}
      </div>

      {mindmapNodes.length === 0 ? (
        <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full space-y-6">
          <div className="text-center space-y-2 mb-4">
             <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 mx-auto shadow-sm">
                <Brain size={32} />
             </div>
             <p className="text-blue-700 font-bold">Tư duy hệ thống qua sơ đồ thông minh</p>
          </div>
          
          <div className="space-y-4">
             <select 
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full bg-white border-2 border-blue-100 rounded-2xl px-6 py-4 outline-none focus:border-blue-500 font-bold text-blue-900"
             >
                <option value="">Chọn khối lớp...</option>
                <option value="6">Khối 6</option>
                <option value="7">Khối 7</option>
                <option value="8">Khối 8</option>
                <option value="9">Khối 9</option>
             </select>
             <input 
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Nhập bài học/chủ đề..."
                className="w-full bg-white border-2 border-blue-100 rounded-2xl px-6 py-4 outline-none focus:border-blue-500 font-bold text-blue-900"
             />
             <button 
                onClick={createMindmap}
                disabled={!topic.trim() || !grade}
                className="w-full bg-blue-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-50"
             >
                TẠO SƠ ĐỒ
             </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
           <div className="bg-white rounded-[2.5rem] p-10 border border-blue-50 shadow-sm">
              <MindmapView nodes={mindmapNodes} />
           </div>
        </div>
      )}
    </div>
  );
}

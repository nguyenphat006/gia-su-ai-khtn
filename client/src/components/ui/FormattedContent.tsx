import React from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { processLaTeX, cn } from "@/lib/utils";

interface FormattedContentProps {
  content: string;
  className?: string;
  isInline?: boolean;
}

/**
 * Component chung để hiển thị nội dung chứa Markdown và công thức LaTeX (Vật lý, Toán học)
 */
const FormattedContent: React.FC<FormattedContentProps> = ({ content, className, isInline = false }) => {
  if (!content) return null;

  const processed = processLaTeX(content);

  if (isInline) {
    return (
      <span className={cn("inline-block", className)}>
        <ReactMarkdown 
          remarkPlugins={[remarkMath]} 
          rehypePlugins={[rehypeKatex]}
          components={{
            p: ({ children }) => <>{children}</>, // Loại bỏ bọc p để không bị ngắt dòng
          }}
        >
          {processed}
        </ReactMarkdown>
      </span>
    );
  }

  return (
    <div className={cn("prose prose-slate max-w-none prose-sm md:prose-base", className)}>
      <ReactMarkdown 
        remarkPlugins={[remarkMath]} 
        rehypePlugins={[rehypeKatex]}
        components={{
          p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
        }}
      >
        {processed}
      </ReactMarkdown>
    </div>
  );
};

export default FormattedContent;

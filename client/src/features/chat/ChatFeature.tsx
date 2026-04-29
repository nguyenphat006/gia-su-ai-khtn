import { useChat } from "./hooks/useChat";
import MessageList from "./components/MessageList";
import ChatInput from "./components/ChatInput";

interface ChatFeatureProps {
  studentName: string;
  addXP: (amount: number) => void;
  userId: string;
}

export default function ChatFeature({ studentName, addXP, userId }: ChatFeatureProps) {
  const {
    messages,
    input,
    setInput,
    isLoading,
    setIsLoading,
    selectedImage,
    setSelectedImage,
    selectedFile,
    setSelectedFile,
    handleSend
  } = useChat(userId, studentName, addXP);

  return (
    <div className="flex flex-col h-full w-full max-w-6xl mx-auto relative overflow-hidden">
      {/* 
        Vùng hiển thị tin nhắn: 
        - flex-1: Chiếm toàn bộ không gian còn lại.
        - min-h-0: Quan trọng để flex child có thể co lại và scroll.
      */}
      <div className="flex-1 min-h-0 w-full px-4 sm:px-6">
        <MessageList messages={messages} isLoading={isLoading} />
      </div>
      
      {/* 
        Vùng nhập liệu: 
        - shrink-0: Không bao giờ bị co lại.
        - Cố định ở đáy.
      */}
      <div className="w-full shrink-0">
        <ChatInput 
          input={input}
          setInput={setInput}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          selectedImage={selectedImage}
          setSelectedImage={setSelectedImage}
          selectedFile={selectedFile}
          setSelectedFile={setSelectedFile}
          handleSend={handleSend}
        />
      </div>
    </div>
  );
}

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
    <div className="flex flex-col h-full max-w-4xl mx-auto relative">
      <MessageList messages={messages} isLoading={isLoading} />
      
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
  );
}

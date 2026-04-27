import ChatInterface from "@/components/chat/ChatInterface";

interface ChatPageProps {
  studentName: string;
  addXP: (amount: number) => void;
  userId: string;
}

export default function ChatPage({ studentName, addXP, userId }: ChatPageProps) {
  return <ChatInterface studentName={studentName} addXP={addXP} userId={userId} />;
}

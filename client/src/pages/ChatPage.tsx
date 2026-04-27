import ChatFeature from "@/features/chat/ChatFeature";

interface ChatPageProps {
  studentName: string;
  addXP: (amount: number) => void;
  userId: string;
}

export default function ChatPage({ studentName, addXP, userId }: ChatPageProps) {
  return <ChatFeature studentName={studentName} addXP={addXP} userId={userId} />;
}

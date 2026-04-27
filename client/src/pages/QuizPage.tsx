import QuizSection from "@/components/assessment/QuizSection";

interface QuizPageProps {
  studentName: string;
  addXP: (amount: number) => void;
  userId: string;
}

export default function QuizPage({ studentName, addXP, userId }: QuizPageProps) {
  return <QuizSection studentName={studentName} addXP={addXP} userId={userId} />;
}

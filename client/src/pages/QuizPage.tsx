import AssessmentFeature from "@/features/assessment/AssessmentFeature";

interface QuizPageProps {
  studentName: string;
  addXP: (amount: number) => void;
  userId: string;
}

export default function QuizPage({ studentName, addXP, userId }: QuizPageProps) {
  return <AssessmentFeature studentName={studentName} addXP={addXP} userId={userId} />;
}

import ArenaFeature from "@/features/arena/ArenaFeature";

interface ArenaPageProps {
  studentName: string;
  addXP: (amount: number) => void;
  totalXP: number;
}

export default function ArenaPage({ studentName, addXP, totalXP }: ArenaPageProps) {
  return <ArenaFeature studentName={studentName} addXP={addXP} totalXP={totalXP} />;
}

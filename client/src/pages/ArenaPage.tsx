import Arena from "@/components/arena/Arena";

interface ArenaPageProps {
  studentName: string;
  addXP: (amount: number) => void;
  totalXP: number;
}

export default function ArenaPage({ studentName, addXP, totalXP }: ArenaPageProps) {
  return <Arena studentName={studentName} addXP={addXP} totalXP={totalXP} />;
}

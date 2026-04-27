import TeacherPanel from "@/components/teacher/TeacherPanel";

interface TeacherPageProps {
  schoolLogo: string | null;
  onLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isUploadingLogo: boolean;
}

export default function TeacherPage({ schoolLogo, onLogoUpload, isUploadingLogo }: TeacherPageProps) {
  return <TeacherPanel schoolLogo={schoolLogo} onLogoUpload={onLogoUpload} isUploadingLogo={isUploadingLogo} />;
}

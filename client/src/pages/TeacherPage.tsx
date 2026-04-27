import TeacherFeature from "@/features/teacher/TeacherFeature";

interface TeacherPageProps {
  schoolLogo: string | null;
  onLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isUploadingLogo: boolean;
}

export default function TeacherPage({ schoolLogo, onLogoUpload, isUploadingLogo }: TeacherPageProps) {
  return <TeacherFeature schoolLogo={schoolLogo} onLogoUpload={onLogoUpload} isUploadingLogo={isUploadingLogo} />;
}

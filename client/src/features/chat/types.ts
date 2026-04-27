export interface Message {
  role: "user" | "model";
  content: string;
  timestamp: any;
  studentId: string;
}

export interface SelectedFile {
  name: string;
  content: string;
}

export interface SelectedImage {
  data: string;
  mimeType: string;
}

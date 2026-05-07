export interface Message {
  role: "user" | "model";
  content: string;
  timestamp: any;
  studentId: string;
  attachments?: {
    type: string;
    mimeType: string;
    data?: string;
    url?: string;
  }[];
}

export interface SelectedFile {
  name: string;
  content: string;
}

export interface SelectedImage {
  data: string;
  mimeType: string;
}

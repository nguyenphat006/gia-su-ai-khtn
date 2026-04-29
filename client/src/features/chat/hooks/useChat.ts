import { useState, useEffect } from "react";
import { Message, SelectedImage, SelectedFile } from "../types";

// ── Mock Data dành cho demo ──────────────────────────────────────
const MOCK_MESSAGES: Message[] = [
  {
    role: "model",
    content: "Chào em! Cô là trợ lý học tập KHTN. Em có biết tại sao lá cây lại có màu xanh không? 🌱",
    timestamp: new Date(Date.now() - 1000 * 60 * 10),
    studentId: "demo"
  },
  {
    role: "user",
    content: "Dạ có phải do diệp lục không cô?",
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    studentId: "demo"
  },
  {
    role: "model",
    content: "Chính xác rồi! Diệp lục giúp cây hấp thụ ánh sáng mặt trời để quang hợp. Em nắm bài rất tốt! 👏",
    timestamp: new Date(Date.now() - 1000 * 60 * 2),
    studentId: "demo"
  }
];

export function useChat(userId: string, studentName: string, addXP: (xp: number) => void) {
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(null);
  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);

  // Giả lập khởi tạo chào mừng
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{ 
        role: "model", 
        content: `Chào mừng em **${studentName}** đến với Gia sư AI KHTN! 👋\n\nHôm nay em muốn cùng cô khám phá kiến thức thú vị nào?`,
        timestamp: new Date(),
        studentId: userId
      }]);
    }
  }, [studentName, userId]);

  const handleSend = async () => {
    if ((!input.trim() && !selectedImage && !selectedFile) || isLoading) return;

    const userText = input;
    
    // 1. Add User Message
    const userMsg: Message = {
      studentId: userId,
      role: "user",
      content: userText || "🖼️ Đã gửi nội dung đính kèm",
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setSelectedImage(null);
    setSelectedFile(null);
    setIsLoading(true);

    // 2. Giả lập AI trả lời (Static Chat)
    setTimeout(() => {
      const aiResponses = [
        "Câu hỏi của em rất hay! Để cô giải thích kỹ hơn về phần này nhé...",
        "Đúng rồi đó em, kiến thức này nằm trong chương 2 sách Chân trời sáng tạo.",
        "Em có muốn thử làm một bài tập nhỏ về nội dung này không? 😊",
        "Tuyệt vời! Em đang học rất chăm chỉ. Điểm 10 cho sự nỗ lực của em! 🌟"
      ];
      
      const randomResponse = aiResponses[Math.floor(Math.random() * aiResponses.length)];
      
      const aiMsg: Message = {
        studentId: userId,
        role: "model",
        content: randomResponse,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMsg]);
      setIsLoading(false);
      addXP(10); // Tăng XP ảo để demo
    }, 1500);
  };

  return {
    messages,
    input,
    setInput,
    isLoading,
    setIsLoading,
    selectedImage,
    setSelectedImage,
    selectedFile,
    setSelectedFile,
    handleSend
  };
}

import { useState, useEffect, useRef } from "react";
import { Message, SelectedImage, SelectedFile } from "../types";
import { chatService } from "../service";

export function useChat(userId: string, studentName: string, addXP: (xp: number) => void) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(null);
  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);
  
  const isInitialized = useRef(false);

  // Khởi tạo: Lấy danh sách session, nếu chưa có thì tạo mới
  useEffect(() => {
    async function initChat() {
      try {
        const sessions = await chatService.getSessions();
        let currentSessionId = null;

        if (sessions && sessions.length > 0) {
          currentSessionId = sessions[0].id; // Lấy session gần nhất
        } else {
          // Tạo session mới nếu chưa có
          const newSession = await chatService.createSession("Đoạn chat mới");
          currentSessionId = newSession.id;
        }

        setSessionId(currentSessionId);

        // Fetch messages của session hiện tại
        if (currentSessionId) {
          const apiMessages = await chatService.getMessages(currentSessionId);
          if (apiMessages.length === 0) {
            // Chào mừng mặc định nếu session trống
            setMessages([{ 
              role: "model", 
              content: `Chào mừng em **${studentName}** đến với Gia sư AI KHTN! 👋\n\nHôm nay em muốn cùng cô khám phá kiến thức thú vị nào?`,
              timestamp: new Date(),
              studentId: userId
            }]);
          } else {
            // Chuyển đổi định dạng API sang định dạng UI Message
            setMessages(apiMessages.map((m: any) => ({
              role: m.role === "USER" ? "user" : "model",
              content: m.content,
              timestamp: new Date(m.createdAt),
              studentId: userId,
            })));
          }
        }
      } catch (error) {
        console.error("Lỗi khởi tạo chat:", error);
      }
    }

    if (userId && !isInitialized.current) {
      isInitialized.current = true;
      initChat();
    }
  }, [userId, studentName]);

  const handleSend = async () => {
    if (!sessionId || (!input.trim() && !selectedImage && !selectedFile) || isLoading) return;

    const userText = input;
    
    // 1. Hiển thị ngay tin nhắn của người dùng (Optimistic UI)
    const userMsg: Message = {
      studentId: userId,
      role: "user",
      content: userText || (selectedImage ? "🖼️ Đã gửi hình ảnh" : "📁 Đã gửi tệp"),
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      // 2. Gọi API gửi tin nhắn (Bao gồm Base64 nếu có)
      const imageBase64 = selectedImage?.data;
      const mimeType = selectedImage?.mimeType;

      // Xoá ảnh/tệp đã chọn sau khi chuẩn bị xong payload
      setSelectedImage(null);
      setSelectedFile(null);

      const result = await chatService.sendMessage(sessionId, userText, imageBase64, mimeType);
      
      // 3. Hiển thị phản hồi từ AI
      const aiMsg: Message = {
        studentId: userId,
        role: "model",
        content: result.aiMessage.content,
        timestamp: new Date(result.aiMessage.createdAt)
      };
      
      setMessages(prev => [...prev, aiMsg]);
      
      // 4. Cộng EXP
      if (result.addedXp) {
        addXP(result.addedXp);
      }

    } catch (error) {
      console.error("Lỗi khi gửi tin nhắn:", error);
      // Hiển thị lỗi báo cho user
      setMessages(prev => [...prev, {
        studentId: userId,
        role: "model",
        content: "❌ Xin lỗi, đã có lỗi kết nối xảy ra. Em thử lại nhé!",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
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

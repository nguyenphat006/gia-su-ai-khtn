import { useState, useEffect } from "react";
import { collection, addDoc, onSnapshot, query, where, orderBy, serverTimestamp, getDocs } from "firebase/firestore";
import { db, handleFirestoreError } from "@/lib/firebase";
import { askGiaSu, getRelevantContext } from "@/lib/gemini";
import { Message, SelectedImage, SelectedFile } from "../types";

export function useChat(userId: string, studentName: string, addXP: (xp: number) => void) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(null);
  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);
  const [context, setContext] = useState("");

  useEffect(() => {
    // Fetch RAG context from Firestore
    const fetchContext = async () => {
      try {
        const docsSnap = await getDocs(collection(db, "documents"));
        const docsText = docsSnap.docs.map(d => d.data().content).join("\n\n");
        setContext(docsText);
      } catch (err) {
        handleFirestoreError(err, 'list', 'documents');
      }
    };
    fetchContext();

    // Listen to messages
    const q = query(
      collection(db, "messages"),
      where("studentId", "==", userId),
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => doc.data() as Message);
      if (msgs.length === 0) {
         setMessages([{ 
            role: "model", 
            content: `Chào mừng em **${studentName}** đến với Gia sư AI KHTN! 👋\n\nCô là trợ lý giúp em học tốt môn Khoa học Tự nhiên. Hôm nay em muốn khám phá điều gì cùng cô nào?`,
            timestamp: new Date(),
            studentId: userId
         }]);
      } else {
         setMessages(msgs);
      }
    }, (error) => {
      handleFirestoreError(error, 'list', 'messages');
    });

    return () => unsubscribe();
  }, [userId, studentName]);

  const handleSend = async () => {
    if ((!input.trim() && !selectedImage && !selectedFile) || isLoading) return;

    const userText = input;
    const currentImage = selectedImage;
    const currentFile = selectedFile;
    
    setInput("");
    setSelectedImage(null);
    setSelectedFile(null);
    setIsLoading(true);

    try {
      const relevantContext = await getRelevantContext(userText || "Phân tích nội dung đính kèm");
      
      let finalPrompt = userText;
      if (currentFile) {
        finalPrompt = `Dựa trên tài liệu đính kèm ("${currentFile.name}"): \n\n${currentFile.content}\n\nHọc sinh hỏi: ${userText || "Hãy giải bài tập/tóm tắt tài liệu này."}`;
      }

      try {
        await addDoc(collection(db, "messages"), {
          studentId: userId,
          role: "user",
          content: userText || (currentImage ? "🖼️ Em đã gửi một hình ảnh." : (currentFile ? `📂 Tài liệu: ${currentFile.name}` : "")),
          timestamp: serverTimestamp()
        });
      } catch (err) {
        handleFirestoreError(err, 'create', 'messages');
      }

      const history = messages.map(m => ({ role: m.role, parts: [{ text: m.content }] }));
      const response = await askGiaSu(finalPrompt, history, relevantContext, currentImage || undefined);
      
      try {
        await addDoc(collection(db, "messages"), {
          studentId: userId,
          role: "model",
          content: response || "",
          timestamp: serverTimestamp()
        });
      } catch (err) {
        handleFirestoreError(err, 'create', 'messages');
      }

      addXP(5);
    } catch (error) {
      console.error(error);
      await addDoc(collection(db, "messages"), {
        studentId: userId,
        role: "model",
        content: "❗ Có lỗi xảy ra, cô chưa thể trả lời ngay lúc này.",
        timestamp: serverTimestamp()
      });
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

import { useState, useEffect } from "react";
import { db, handleFirestoreError } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, getDocs, deleteDoc, doc } from "firebase/firestore";

export function useKnowledgeBase() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "success" | "error">("idle");
  const [documents, setDocuments] = useState<any[]>([]);

  const fetchDocuments = async () => {
    try {
      const snap = await getDocs(collection(db, "documents"));
      setDocuments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      handleFirestoreError(err, 'list', 'documents');
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadStatus("idle");

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Data = event.target?.result as string;
      try {
        const response = await fetch("/api/extract-text", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileData: base64Data,
            fileName: file.name,
            mimeType: file.type
          })
        });

        if (!response.ok) throw new Error("Extraction failed");
        
        const { text } = await response.json();
        
        const splitIntoChunks = (rawText: string, size = 600) => {
           const sentences = rawText.split(/(?<=[.!?])\s+/);
           let chunks: string[] = [];
           let current = "";

           for (let s of sentences) {
             if ((current + s).length < size) {
               current += s + " ";
             } else {
               chunks.push(current.trim());
               current = s + " ";
             }
           }
           if (current) chunks.push(current.trim());
           return chunks;
        };

        const chunks = splitIntoChunks(text);
        
        const docRef = await addDoc(collection(db, "documents"), {
          title: file.name,
          chunkCount: chunks.length,
          type: file.type.split("/")[1] || "txt",
          uploadedAt: serverTimestamp()
        });

        const savePromises = chunks.map(chunkContent => 
           addDoc(collection(db, "knowledge_base"), {
              docId: docRef.id,
              docTitle: file.name,
              content: chunkContent,
              length: chunkContent.length,
              source: "teacher_upload"
           })
        );

        await Promise.all(savePromises);

        await fetchDocuments();
        setUploadStatus("success");
      } catch (error) {
        console.error(error);
        setUploadStatus("error");
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const clearDatabase = async () => {
    if (!confirm("Bạn có chắc chắn muốn xóa tất cả tài liệu? Hệ thống học tập sẽ trống trơn!")) return;
    try {
      const snap = await getDocs(collection(db, "documents"));
      const deleteDocsPromises = snap.docs.map(d => deleteDoc(doc(db, "documents", d.id)));
      
      const kbSnap = await getDocs(collection(db, "knowledge_base"));
      const deleteKbPromises = kbSnap.docs.map(d => deleteDoc(doc(db, "knowledge_base", d.id)));

      await Promise.all([...deleteDocsPromises, ...deleteKbPromises]);
      await fetchDocuments();
    } catch (err) {
      handleFirestoreError(err, 'delete', 'documents');
    }
  };

  return {
    isUploading,
    uploadStatus,
    documents,
    handleFileUpload,
    clearDatabase
  };
}

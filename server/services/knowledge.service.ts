import { prisma } from "../config/prisma.js";

export interface CreateKnowledgeDto {
  title: string;
  content: string;
  tags?: string[];
  isActive?: boolean;
}

export interface UpdateKnowledgeDto {
  title?: string;
  content?: string;
  tags?: string[];
  isActive?: boolean;
}

/**
 * Lấy danh sách tài liệu
 */
export async function getKnowledgeDocuments(onlyActive = false) {
  return prisma.knowledgeDocument.findMany({
    where: onlyActive ? { isActive: true } : undefined,
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Thêm tài liệu mới
 */
export async function createKnowledgeDocument(data: CreateKnowledgeDto) {
  return prisma.knowledgeDocument.create({
    data: {
      title: data.title,
      content: data.content,
      tags: data.tags || [],
      isActive: data.isActive ?? true,
    },
  });
}

/**
 * Cập nhật tài liệu
 */
export async function updateKnowledgeDocument(id: string, data: UpdateKnowledgeDto) {
  return prisma.knowledgeDocument.update({
    where: { id },
    data: {
      title: data.title,
      content: data.content,
      tags: data.tags,
      isActive: data.isActive,
    },
  });
}

/**
 * Xóa tài liệu
 */
export async function deleteKnowledgeDocument(id: string) {
  return prisma.knowledgeDocument.delete({
    where: { id },
  });
}

/**
 * Trích xuất các tài liệu phù hợp nhất (Keyword Matching/Simple RAG)
 */
export async function retrieveRelevantContext(query: string, limit = 3): Promise<string> {
  const docs = await getKnowledgeDocuments(true);
  
  if (docs.length === 0) return "";

  const keywords = query.toLowerCase().split(/\s+/).filter((w) => w.length > 2);

  const scoredDocs = docs.map((doc: any) => {
    let score = 0;
    const lowContent = doc.content.toLowerCase();
    keywords.forEach((word) => {
      if (lowContent.includes(word)) score++;
    });
    return { ...doc, score };
  });

  const relevant = scoredDocs
    .filter((item: any) => item.score > 0)
    .sort((a: any, b: any) => b.score - a.score)
    .slice(0, limit);

  return relevant.map((item: any) => item.content).join("\n\n---\n\n");
}

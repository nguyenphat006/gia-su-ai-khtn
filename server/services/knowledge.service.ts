import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { NotFoundError } from "../utils/errors.js";

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

interface ListKnowledgeQuery {
  page?: number;
  limit?: number;
  search?: string;
  onlyActive?: boolean;
}

/**
 * Lấy danh sách tài liệu với phân trang và tìm kiếm (Chuẩn hóa theo user.service)
 */
export async function getKnowledgeDocuments(query: ListKnowledgeQuery) {
  const page = Math.max(1, query.page || 1);
  const limit = Math.min(100, Math.max(1, query.limit || 20));
  const skip = (page - 1) * limit;

  const where: Prisma.KnowledgeDocumentWhereInput = {};

  if (query.onlyActive) {
    where.isActive = true;
  }

  if (query.search) {
    const search = query.search.trim();
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { content: { contains: search, mode: "insensitive" } },
    ];
  }

  const [documents, total] = await Promise.all([
    prisma.knowledgeDocument.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.knowledgeDocument.count({ where }),
  ]);

  return {
    documents,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Thêm tài liệu mới
 */
export async function createKnowledgeDocument(data: CreateKnowledgeDto) {
  return prisma.knowledgeDocument.create({
    data: {
      title: data.title.trim(),
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
  const existing = await prisma.knowledgeDocument.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError("Không tìm thấy tài liệu tri thức.");
  }

  return prisma.knowledgeDocument.update({
    where: { id },
    data: {
      title: data.title?.trim(),
      content: data.content,
      tags: data.tags,
      isActive: data.isActive,
    },
  });
}

/**
 * Xóa nhiều tài liệu (bulk delete)
 */
export async function deleteKnowledgeDocuments(ids: string[]) {
  const result = await prisma.knowledgeDocument.deleteMany({
    where: { id: { in: ids } },
  });

  if (result.count === 0) {
    throw new NotFoundError("Không tìm thấy tài liệu nào để xoá.");
  }

  return { message: `Xóa thành công ${result.count} tài liệu.` };
}


/**
 * Trích xuất các tài liệu phù hợp nhất (Keyword Matching/Simple RAG)
 */
export async function retrieveRelevantContext(query: string, limit = 3): Promise<string> {
  const result = await getKnowledgeDocuments({ onlyActive: true });
  const docs = result.documents;
  
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

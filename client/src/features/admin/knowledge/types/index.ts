export interface KnowledgeDocument {
  id: string;
  title: string;
  content: string;
  tags: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationData {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface KnowledgeListResponse {
  status: "ok";
  data: {
    documents: KnowledgeDocument[];
    pagination: PaginationData;
  };
}

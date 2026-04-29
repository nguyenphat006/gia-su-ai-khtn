import { Request, Response, NextFunction } from "express";
import {
  createKnowledgeDocument,
  deleteKnowledgeDocument,
  getKnowledgeDocuments,
  updateKnowledgeDocument,
} from "../services/knowledge.service.js";

export async function listDocuments(req: Request, res: Response, next: NextFunction) {
  try {
    const onlyActive = req.query.active === "true";
    const documents = await getKnowledgeDocuments(onlyActive);
    res.json({
      status: "success",
      data: { documents },
    });
  } catch (error) {
    next(error);
  }
}

export async function createDocument(req: Request, res: Response, next: NextFunction) {
  try {
    const { title, content, tags, isActive } = req.body;

    if (!title || !content) {
      res.status(400).json({ status: "error", message: "Title and content are required" });
      return;
    }

    const document = await createKnowledgeDocument({ title, content, tags, isActive });

    res.status(201).json({
      status: "success",
      data: { document },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateDocument(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { title, content, tags, isActive } = req.body;

    const document = await updateKnowledgeDocument(id, { title, content, tags, isActive });

    res.json({
      status: "success",
      data: { document },
    });
  } catch (error) {
    next(error);
  }
}

export async function removeDocument(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    await deleteKnowledgeDocument(id);
    
    res.json({
      status: "success",
      message: "Document deleted successfully",
    });
  } catch (error) {
    next(error);
  }
}

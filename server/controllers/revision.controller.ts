import { Request, Response, NextFunction } from "express";
import { prisma } from "../config/prisma.js";

// ==========================================
// 1. QUESTION BANK (CHINH PHỤC TRI THỨC)
// ==========================================

export async function getQuestionBank(req: Request, res: Response, next: NextFunction) {
  try {
    const { classId, topic, difficulty, type } = req.query;
    
    // Xây dựng query filter
    const whereClause: any = { isActive: true };
    if (classId) whereClause.classId = String(classId);
    if (topic) whereClause.topic = String(topic);
    if (difficulty) whereClause.difficulty = String(difficulty);
    if (type) whereClause.type = String(type);

    const questions = await prisma.questionBank.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: { class: true }
    });

    res.json({
      status: "success",
      data: { questions }
    });
  } catch (error) {
    next(error);
  }
}

export async function createQuestionBank(req: Request, res: Response, next: NextFunction) {
  try {
    const { classId, topic, type, difficulty, content, options, correctAnswer, explanation } = req.body;
    
    if (!classId || !topic || !type || !difficulty || !content || !correctAnswer) {
      return res.status(400).json({ status: "error", message: "Thiếu các trường bắt buộc (classId, topic, type, difficulty, content, correctAnswer)" });
    }

    const question = await prisma.questionBank.create({
      data: {
        classId,
        topic,
        type,
        difficulty,
        content,
        options: options || null,
        correctAnswer,
        explanation
      }
    });

    res.status(201).json({
      status: "success",
      data: { question }
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteQuestionBank(req: Request, res: Response, next: NextFunction) {
  try {
    const { ids } = req.body; // Bắt Array các ID từ request body
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ status: "error", message: "Danh sách IDs không hợp lệ" });
    }
    await prisma.questionBank.deleteMany({ where: { id: { in: ids } } });
    res.json({ status: "success", message: `Đã xoá ${ids.length} câu hỏi` });
  } catch (error) {
    next(error);
  }
}

// ==========================================
// 2. FLASHCARD DECKS
// ==========================================

export async function getFlashcards(req: Request, res: Response, next: NextFunction) {
  try {
    const { classId, topic } = req.query;
    
    const whereClause: any = { isActive: true };
    if (classId) whereClause.classId = String(classId);
    if (topic) whereClause.topic = String(topic);

    const decks = await prisma.flashcardDeck.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: { class: true }
    });

    res.json({
      status: "success",
      data: { decks }
    });
  } catch (error) {
    next(error);
  }
}

export async function createFlashcard(req: Request, res: Response, next: NextFunction) {
  try {
    const { classId, topic, title, cards } = req.body;
    
    if (!classId || !topic || !title || !cards) {
      return res.status(400).json({ status: "error", message: "Thiếu các trường bắt buộc (classId, topic, title, cards)" });
    }

    const deck = await prisma.flashcardDeck.create({
      data: {
        classId,
        topic,
        title,
        cards
      }
    });

    res.status(201).json({
      status: "success",
      data: { deck }
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteFlashcard(req: Request, res: Response, next: NextFunction) {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ status: "error", message: "Danh sách IDs không hợp lệ" });
    }
    await prisma.flashcardDeck.deleteMany({ where: { id: { in: ids } } });
    res.json({ status: "success", message: `Đã xoá ${ids.length} flashcard` });
  } catch (error) {
    next(error);
  }
}

// ==========================================
// 3. MINDMAP DATA
// ==========================================

export async function getMindmaps(req: Request, res: Response, next: NextFunction) {
  try {
    const { classId, topic } = req.query;
    
    const whereClause: any = { isActive: true };
    if (classId) whereClause.classId = String(classId);
    if (topic) whereClause.topic = String(topic);

    const mindmaps = await prisma.mindmapData.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: { class: true }
    });

    res.json({
      status: "success",
      data: { mindmaps }
    });
  } catch (error) {
    next(error);
  }
}

export async function createMindmap(req: Request, res: Response, next: NextFunction) {
  try {
    const { classId, topic, title, markdown } = req.body;
    
    if (!classId || !topic || !title || !markdown) {
      return res.status(400).json({ status: "error", message: "Thiếu các trường bắt buộc (classId, topic, title, markdown)" });
    }

    const mindmap = await prisma.mindmapData.create({
      data: {
        classId,
        topic,
        title,
        markdown
      }
    });

    res.status(201).json({
      status: "success",
      data: { mindmap }
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteMindmap(req: Request, res: Response, next: NextFunction) {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ status: "error", message: "Danh sách IDs không hợp lệ" });
    }
    await prisma.mindmapData.deleteMany({ where: { id: { in: ids } } });
    res.json({ status: "success", message: `Đã xoá ${ids.length} mindmap` });
  } catch (error) {
    next(error);
  }
}

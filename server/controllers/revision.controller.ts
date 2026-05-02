import { Request, Response, NextFunction } from "express";
import { prisma } from "../config/prisma.js";
import * as revisionService from "../services/revision.service.js";
import { asyncHandler } from "../middleware/error-handler.js";

/**
 * Helper to get pagination params
 */
const getPagination = (query: any) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

// ==========================================
// 1. QUESTION BANK (ADMIN & CLIENT COMMON)
// ==========================================

export async function getQuestionBank(req: Request, res: Response, next: NextFunction) {
  try {
    const { classId, grade, topic, difficulty, type, isActive } = req.query;
    const { page, limit, skip } = getPagination(req.query);
    
    // Xây dựng query filter
    const whereClause: any = {};
    if (isActive !== undefined) whereClause.isActive = isActive === "true";
    if (classId) whereClause.classId = String(classId);
    if (grade) whereClause.grade = Number(grade);
    if (topic) whereClause.topic = { contains: String(topic), mode: "insensitive" };
    if (difficulty) whereClause.difficulty = String(difficulty);
    if (type) whereClause.type = String(type);

    const [questions, total] = await Promise.all([
      prisma.questionBank.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        include: { class: true },
        skip,
        take: limit
      }),
      prisma.questionBank.count({ where: whereClause })
    ]);

    res.json({
      status: "success",
      data: { 
        questions,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function createQuestionBank(req: Request, res: Response, next: NextFunction) {
  try {
    const { classId, grade, topic, type, difficulty, content, options, correctAnswer, explanation } = req.body;
    
    if (!topic || !type || !difficulty || !content || !correctAnswer) {
      return res.status(400).json({ status: "error", message: "Thiếu các trường bắt buộc" });
    }

    const question = await prisma.questionBank.create({
      data: {
        classId: classId || null,
        grade: grade ? Number(grade) : null,
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

export const updateQuestionBank = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { classId, grade, topic, type, difficulty, content, options, correctAnswer, explanation, isActive } = req.body;

  const question = await prisma.questionBank.update({
    where: { id },
    data: {
      classId,
      grade: grade ? Number(grade) : undefined,
      topic,
      type,
      difficulty,
      content,
      options: options !== undefined ? options : undefined,
      correctAnswer,
      explanation,
      isActive
    }
  });

  res.json({ status: "success", data: { question } });
});

export async function deleteQuestionBank(req: Request, res: Response, next: NextFunction) {
  try {
    const { ids } = req.body; 
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
    const { classId, grade, topic, isActive } = req.query;
    const { page, limit, skip } = getPagination(req.query);
    
    const whereClause: any = {};
    if (isActive !== undefined) whereClause.isActive = isActive === "true";
    if (classId) whereClause.classId = String(classId);
    if (grade) whereClause.grade = Number(grade);
    if (topic) whereClause.topic = { contains: String(topic), mode: "insensitive" };

    const [decks, total] = await Promise.all([
      prisma.flashcardDeck.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        include: { class: true },
        skip,
        take: limit
      }),
      prisma.flashcardDeck.count({ where: whereClause })
    ]);

    res.json({
      status: "success",
      data: { 
        decks,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function createFlashcard(req: Request, res: Response, next: NextFunction) {
  try {
    const { classId, grade, topic, title, cards } = req.body;
    
    if (!topic || !title || !cards) {
      return res.status(400).json({ status: "error", message: "Thiếu các trường bắt buộc" });
    }

    const deck = await prisma.flashcardDeck.create({
      data: {
        classId: classId || null,
        grade: grade ? Number(grade) : null,
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

export const updateFlashcard = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { classId, grade, topic, title, cards, isActive } = req.body;

  const deck = await prisma.flashcardDeck.update({
    where: { id },
    data: {
      classId,
      grade: grade ? Number(grade) : undefined,
      topic,
      title,
      cards,
      isActive
    }
  });

  res.json({ status: "success", data: { deck } });
});

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
    const { classId, grade, topic, isActive } = req.query;
    const { page, limit, skip } = getPagination(req.query);
    
    const whereClause: any = {};
    if (isActive !== undefined) whereClause.isActive = isActive === "true";
    if (classId) whereClause.classId = String(classId);
    if (grade) whereClause.grade = Number(grade);
    if (topic) whereClause.topic = { contains: String(topic), mode: "insensitive" };

    const [mindmaps, total] = await Promise.all([
      prisma.mindmapData.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        include: { class: true },
        skip,
        take: limit
      }),
      prisma.mindmapData.count({ where: whereClause })
    ]);

    res.json({
      status: "success",
      data: { 
        mindmaps,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function createMindmap(req: Request, res: Response, next: NextFunction) {
  try {
    const { classId, grade, topic, title, markdown } = req.body;
    
    if (!topic || !title || !markdown) {
      return res.status(400).json({ status: "error", message: "Thiếu các trường bắt buộc" });
    }

    const mindmap = await prisma.mindmapData.create({
      data: {
        classId: classId || null,
        grade: grade ? Number(grade) : null,
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

export const updateMindmap = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { classId, grade, topic, title, markdown, isActive } = req.body;

  const mindmap = await prisma.mindmapData.update({
    where: { id },
    data: {
      classId,
      grade: grade ? Number(grade) : undefined,
      topic,
      title,
      markdown,
      isActive
    }
  });

  res.json({ status: "success", data: { mindmap } });
});

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

// ==========================================
// 4. NEW AI-POWERED LOGIC (STUDENT & ADMIN)
// ==========================================

export const generateDraft = asyncHandler(async (req: Request, res: Response) => {
  const { type, grade, topic, count } = req.body;
  if (!type || !grade || !topic) {
    return res.status(400).json({ status: "error", message: "Thiếu thông tin type, grade hoặc topic" });
  }
  const result = await revisionService.generateDraftContent({ type, grade, topic, count });
  res.json({ status: "success", data: result });
});

export const generateStudentQuiz = asyncHandler(async (req: Request, res: Response) => {
  const { grade, topic, limit = 5, type } = req.body;
  if (!grade || !topic) {
    return res.status(400).json({ status: "error", message: "Vui lòng chọn Khối và Chủ đề" });
  }

  const questions = await revisionService.getQuizForStudent({ 
    grade: Number(grade), 
    topic, 
    limit: Number(limit),
    type 
  });
  res.json({ status: "success", data: { questions } });
});


export const submitStudentQuiz = asyncHandler(async (req: Request, res: Response) => {
  const { quizType, totalQuestions, correctCount } = req.body;
  const userId = (req as any).user.id;
  const result = await revisionService.saveQuizResult({
    userId,
    quizType,
    totalQuestions,
    correctCount
  });
  res.json({ status: "success", data: result });
});

/**
 * Chấm điểm bài tự luận bằng AI
 */
export const evaluateStudentEssay = asyncHandler(async (req: Request, res: Response) => {
  const { question, answer, image } = req.body;
  if (!question || (!answer && !image)) {
    return res.status(400).json({ status: "error", message: "Thiếu thông tin câu hỏi hoặc bài làm" });
  }

  const evaluation = await revisionService.evaluateEssayLogic({ question, answer, image });
  res.json({ status: "success", data: evaluation });
});

export const getStudentFlashcards = asyncHandler(async (req: Request, res: Response) => {
  const { grade, topic } = req.body;
  const deck = await revisionService.getFlashcardsForStudent({ grade: Number(grade), topic });
  res.json({ status: "success", data: deck });
});

export const getStudentMindmap = asyncHandler(async (req: Request, res: Response) => {
  const { grade, topic } = req.body;
  const mindmap = await revisionService.getMindmapForStudent({ grade: Number(grade), topic });
  res.json({ status: "success", data: mindmap });
});

import { Request, Response, NextFunction } from "express";
import {
  createSession,
  getSessionMessages,
  getUserSessions,
  processUserMessage,
} from "../services/chat.service.js";

export async function listSessions(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.auth!.userId;
    const sessions = await getUserSessions(userId);

    res.json({
      status: "success",
      data: { sessions },
    });
  } catch (error) {
    next(error);
  }
}

export async function listMessages(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.auth!.userId;
    const { id } = req.params;
    
    const messages = await getSessionMessages(id, userId);

    res.json({
      status: "success",
      data: { messages },
    });
  } catch (error) {
    next(error);
  }
}

export async function createNewSession(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.auth!.userId;
    const { title } = req.body;

    const session = await createSession(userId, title);

    res.status(201).json({
      status: "success",
      data: { session },
    });
  } catch (error) {
    next(error);
  }
}

export async function sendMessage(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.auth!.userId;
    const { id } = req.params;
    const { content, imageBase64, mimeType } = req.body;

    if (!content) {
      res.status(400).json({ status: "error", message: "Nội dung tin nhắn không được để trống" });
      return;
    }

    let imagePayload = undefined;
    if (imageBase64 && mimeType) {
      // Loại bỏ prefix data:image/...;base64, nếu Client gửi kèm
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
      imagePayload = {
        data: base64Data,
        mimeType,
      };
    }

    const result = await processUserMessage(userId, id, content, imagePayload);

    res.json({
      status: "success",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

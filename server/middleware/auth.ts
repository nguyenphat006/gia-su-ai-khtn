import type { NextFunction, Request, Response } from "express";
import { Role } from "@prisma/client";
import { verifyAccessToken } from "../utils/token.js";
import { UnauthorizedError, ForbiddenError } from "../utils/errors.js";

// Mở rộng interface Request để hỗ trợ thuộc tính auth
declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        username: string;
        role: Role;
        sessionId: string;
      };
    }
  }
}

/**
 * Middleware xác thực người dùng qua Access Token trong Cookie
 */
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.accessToken;

    if (!token) {
      throw new UnauthorizedError("Bạn chưa đăng nhập hoặc phiên làm việc đã hết hạn.");
    }

    const payload = verifyAccessToken(token);
    
    req.auth = {
      userId: payload.sub,
      username: payload.username,
      role: payload.role as Role,
      sessionId: payload.sessionId,
    };

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware phân quyền người dùng
 */
export const authorize = (...roles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth) {
      return next(new UnauthorizedError("Yêu cầu xác thực."));
    }

    if (roles.length > 0 && !roles.includes(req.auth.role)) {
      return next(new ForbiddenError("Bạn không có quyền thực hiện hành động này."));
    }

    next();
  };
};
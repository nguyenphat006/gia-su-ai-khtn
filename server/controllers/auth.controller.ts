import { Request, Response } from "express";
import { asyncHandler } from "../middleware/error-handler.js";
import {
  changePassword,
  getCurrentUser,
  loginUnified,
  logoutSession,
  refreshAuthSession,
  provisionUser,
  bootstrapDefaultAccounts,
} from "../services/auth.service.js";
import { ValidationError, UnauthorizedError } from "../utils/errors.js";

const isProduction = process.env.NODE_ENV === "production";

function getRequestContext(req: Request) {
  return {
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
  };
}

function setAuthCookies(res: Response, accessToken: string, refreshToken: string, expiresInSeconds: number, req?: Request) {
  // Kiểm tra môi trường an toàn (HTTPS hoặc localhost)
  const isLocal = req?.hostname === "localhost" || req?.hostname === "127.0.0.1" || req?.hostname === "::1";
  
  // Ưu tiên dùng X-Forwarded-Proto từ proxy nếu có (Render dùng cái này)
  const protocol = req?.get("X-Forwarded-Proto") || req?.protocol || "http";
  const isSecureConnection = protocol === "https";

  // Cấu hình Cookie an toàn nhưng linh hoạt
  // Lưu ý: Nếu SameSite=None thì BẮT BUỘC Secure=true
  const secure = isSecureConnection;
  const sameSite = isSecureConnection ? "none" : "lax";

  const commonOptions = {
    httpOnly: true,
    secure: secure,
    sameSite: sameSite as any,
    path: "/",
  };

  // Access Token Cookie
  res.cookie("accessToken", accessToken, {
    ...commonOptions,
    maxAge: expiresInSeconds * 1000,
  });

  // Refresh Token Cookie
  res.cookie("refreshToken", refreshToken, {
    ...commonOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

function clearAuthCookies(res: Response, req?: Request) {
  const protocol = req?.get("X-Forwarded-Proto") || req?.protocol || "http";
  const isSecureConnection = protocol === "https";

  const options = {
    httpOnly: true,
    secure: isSecureConnection,
    sameSite: (isSecureConnection ? "none" : "lax") as any,
    path: "/",
  };

  res.clearCookie("accessToken", options);
  res.clearCookie("refreshToken", options);
}

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    throw new ValidationError("Vui lòng cung cấp tên đăng nhập và mật khẩu.");
  }

  const result = await loginUnified(identifier, password, getRequestContext(req));
  
  setAuthCookies(
    res, 
    result.tokens.accessToken, 
    result.tokens.refreshToken, 
    result.tokens.expiresInSeconds,
    req
  );

  res.json({
    status: "ok",
    data: {
      user: result.user
    }
  });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  if (req.auth?.sessionId) {
    await logoutSession(req.auth.sessionId);
  }

  clearAuthCookies(res, req);
  res.json({ status: "ok", message: "Đăng xuất thành công." });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    throw new UnauthorizedError("Không tìm thấy Refresh Token.");
  }

  const result = await refreshAuthSession(refreshToken, getRequestContext(req));

  setAuthCookies(
    res, 
    result.tokens.accessToken, 
    result.tokens.refreshToken, 
    result.tokens.expiresInSeconds,
    req
  );

  res.json({
    status: "ok",
    data: {
      user: result.user
    }
  });
});

export const changeUserPassword = asyncHandler(async (req: Request, res: Response) => {
  const { oldPassword, newPassword } = req.body;
  const userId = req.auth?.userId;

  if (!userId) {
    throw new UnauthorizedError("Yêu cầu xác thực.");
  }

  if (!oldPassword || !newPassword) {
    throw new ValidationError("Vui lòng cung cấp mật khẩu cũ và mật khẩu mới.");
  }

  const result = await changePassword(userId, oldPassword, newPassword);
  res.json({ status: "ok", data: result });
});

export const getMyProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.auth?.userId;

  if (!userId) {
    throw new UnauthorizedError("Yêu cầu xác thực.");
  }

  const user = await getCurrentUser(userId);
  res.json({ status: "ok", data: { user } });
});

export const provisionSchoolUser = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body;
  if (!data.role || !data.displayName || !data.username) {
    throw new ValidationError("Thiếu dữ liệu tạo tài khoản (role, displayName, username).");
  }

  const result = await provisionUser(data);
  res.status(201).json({ status: "ok", data: { user: result } });
});

export const bootstrapDefaults = asyncHandler(async (req: Request, res: Response) => {
  const result = await bootstrapDefaultAccounts();
  res.status(201).json({ status: "ok", data: result });
});


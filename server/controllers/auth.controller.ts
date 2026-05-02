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

function setAuthCookies(res: Response, accessToken: string, refreshToken: string, expiresInSeconds: number) {
  // Access Token Cookie
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: expiresInSeconds * 1000,
  });

  // Refresh Token Cookie
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days (matching getRefreshTokenTtlDays default)
  });
}

function clearAuthCookies(res: Response) {
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
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
    result.tokens.expiresInSeconds
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

  clearAuthCookies(res);
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
    result.tokens.expiresInSeconds
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


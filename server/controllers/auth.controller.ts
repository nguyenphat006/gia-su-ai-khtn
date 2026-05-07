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
import { verifyAccessToken } from "../utils/token.js";

const isProduction = process.env.NODE_ENV === "production";

function getRequestContext(req: Request) {
  return {
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
  };
}

function setAuthCookies(res: Response, accessToken: string, refreshToken: string, expiresInSeconds: number, req?: Request) {
  // Ưu tiên dùng X-Forwarded-Proto từ proxy nếu có (Render dùng cái này)
  const protocol = req?.get("X-Forwarded-Proto") || req?.protocol || "http";
  const isSecureConnection = protocol === "https";

  // Cấu hình Cookie: 
  // Vì chúng ta đã dùng Proxy (Vercel Rewrites), trình duyệt coi Backend và Frontend là cùng Site.
  // Do đó, BẮT BUỘC dùng SameSite=Lax để không bị chặn bởi chính sách Third-party cookie.
  const secure = isSecureConnection;
  const sameSite = "lax"; // Chuyển từ "none" sang "lax" vì đã có Proxy

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
    sameSite: "lax" as any, // Đồng bộ với lúc set
    path: "/",
  };

  // Xóa bằng clearCookie
  res.clearCookie("accessToken", options);
  res.clearCookie("refreshToken", options);

  // Ghi đè bằng giá trị rỗng và maxAge=0 để đảm bảo xóa tuyệt đối trên mọi trình duyệt
  res.cookie("accessToken", "", { ...options, maxAge: 0 });
  res.cookie("refreshToken", "", { ...options, maxAge: 0 });
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
  const token = req.cookies?.accessToken;
  
  // Nếu có token, cố gắng vô hiệu hóa session ở server
  if (token) {
    try {
      const payload = verifyAccessToken(token);
      await logoutSession(payload.sessionId);
    } catch (e) {
      // Token hết hạn hoặc không hợp lệ thì bỏ qua việc revoke session, vẫn tiếp tục xóa cookie
    }
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


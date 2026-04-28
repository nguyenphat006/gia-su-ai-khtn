import { createHash, createHmac, randomBytes } from "node:crypto";
import { UnauthorizedError } from "./errors.js";

export interface AccessTokenPayload {
  sub: string;
  username: string;
  role: string;
  sessionId: string;
  type: "access";
  iat: number;
  exp: number;
}

interface AccessTokenInput {
  userId: string;
  username: string;
  role: string;
  sessionId: string;
}

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET chưa được cấu hình.");
  }

  return secret;
}

function base64UrlEncode(value: string) {
  return Buffer.from(value).toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signTokenValue(value: string) {
  return createHmac("sha256", getJwtSecret()).update(value).digest("base64url");
}

export function getAccessTokenTtlSeconds() {
  return Number(process.env.ACCESS_TOKEN_TTL_MINUTES || 15) * 60;
}

export function getRefreshTokenTtlDays() {
  return Number(process.env.REFRESH_TOKEN_TTL_DAYS || 7);
}

export function createAccessToken(input: AccessTokenInput) {
  const now = Math.floor(Date.now() / 1000);
  const payload: AccessTokenPayload = {
    sub: input.userId,
    username: input.username,
    role: input.role,
    sessionId: input.sessionId,
    type: "access",
    iat: now,
    exp: now + getAccessTokenTtlSeconds(),
  };

  const header = {
    alg: "HS256",
    typ: "JWT",
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;
  const signature = signTokenValue(unsignedToken);

  return `${unsignedToken}.${signature}`;
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const [encodedHeader, encodedPayload, signature] = token.split(".");
  if (!encodedHeader || !encodedPayload || !signature) {
    throw new UnauthorizedError("Access token không hợp lệ.");
  }

  const unsignedToken = `${encodedHeader}.${encodedPayload}`;
  const expectedSignature = signTokenValue(unsignedToken);

  if (signature !== expectedSignature) {
    throw new UnauthorizedError("Chữ ký access token không hợp lệ.");
  }

  const payload = JSON.parse(base64UrlDecode(encodedPayload)) as AccessTokenPayload;

  if (payload.type !== "access") {
    throw new UnauthorizedError("Loại access token không hợp lệ.");
  }

  const now = Math.floor(Date.now() / 1000);
  if (payload.exp <= now) {
    throw new UnauthorizedError("Access token đã hết hạn.");
  }

  return payload;
}

export function generateRefreshToken() {
  return randomBytes(48).toString("base64url");
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

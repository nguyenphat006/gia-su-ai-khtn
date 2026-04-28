import jwt, { type SignOptions } from "jsonwebtoken";
import crypto from "crypto";
import type { Role } from "@prisma/client";

export type AccessTokenPayload = {
  userId: string;
  role: Role;
};

const accessSecret = process.env.JWT_ACCESS_SECRET || "";
const refreshSecret = process.env.JWT_REFRESH_SECRET || "";

if (!accessSecret) throw new Error("Missing JWT_ACCESS_SECRET");
if (!refreshSecret) throw new Error("Missing JWT_REFRESH_SECRET");

export function signAccessToken(payload: AccessTokenPayload) {
  const expiresInSeconds = Number(process.env.ACCESS_TOKEN_TTL_MINUTES || 15) * 60;
  const options: SignOptions = { expiresIn: expiresInSeconds };
  return jwt.sign(payload as object, accessSecret, options);
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, accessSecret) as unknown as AccessTokenPayload;
}

export function signRefreshToken(payload: AccessTokenPayload) {
  const expiresInSeconds = Number(process.env.REFRESH_TOKEN_EXPIRES_IN_DAYS || 7) * 86400;
  const options: SignOptions = { expiresIn: expiresInSeconds };
  return jwt.sign(payload as object, refreshSecret, options);
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, refreshSecret) as unknown as AccessTokenPayload;
}

export function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}
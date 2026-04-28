import jwt from "jsonwebtoken";
import crypto from "crypto";
import type { Role } from "@prisma/client";

export type AccessTokenPayload = {
  userId: string;
  role: Role;
};

const accessSecret = process.env.JWT_ACCESS_SECRET;
const refreshSecret = process.env.JWT_REFRESH_SECRET;

if (!accessSecret) throw new Error("Missing JWT_ACCESS_SECRET");
if (!refreshSecret) throw new Error("Missing JWT_REFRESH_SECRET");

export function signAccessToken(payload: AccessTokenPayload) {
  return jwt.sign(payload, accessSecret, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || "15m",
  });
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, accessSecret) as AccessTokenPayload;
}

export function signRefreshToken(payload: AccessTokenPayload) {
  return jwt.sign(payload, refreshSecret, {
    expiresIn: `${process.env.REFRESH_TOKEN_EXPIRES_IN_DAYS || 7}d`,
  });
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, refreshSecret) as AccessTokenPayload;
}

export function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}
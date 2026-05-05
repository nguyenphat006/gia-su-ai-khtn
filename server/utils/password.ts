import { randomBytes, scrypt as nodeScrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { ValidationError } from "./errors.js";

const scrypt = promisify(nodeScrypt);
const KEY_LENGTH = 64;

export function validatePasswordStrength(password: string) {
  if (password.length < 6) {
    throw new ValidationError("Mật khẩu phải có ít nhất 6 ký tự.");
  }

  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    throw new ValidationError("Mật khẩu phải có ít nhất 1 chữ cái và 1 chữ số.");
  }
}

export async function hashPassword(password: string, shouldValidate = true): Promise<string> {
  if (shouldValidate) {
    validatePasswordStrength(password);
  }

  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;
  return `${salt}:${derivedKey.toString("hex")}`;
}

export async function verifyPassword(
  password: string,
  storedHash: string | null | undefined,
): Promise<boolean> {
  if (!storedHash) {
    return false;
  }

  const [salt, hashHex] = storedHash.split(":");
  if (!salt || !hashHex) {
    return false;
  }

  const derivedKey = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;
  const expectedKey = Buffer.from(hashHex, "hex");

  if (derivedKey.length !== expectedKey.length) {
    return false;
  }

  return timingSafeEqual(derivedKey, expectedKey);
}

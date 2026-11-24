import { createHash, createHmac, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { env } from "../config/env";

// ---------- passwords (scrypt, built into Node: no native packages to compile) ----------
const SCRYPT_N = 2 ** 16;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEY_LENGTH = 64;
const MAX_MEMORY = 256 * 1024 * 1024;

function derive(password: string, salt: Buffer, n: number, r: number, p: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password.normalize("NFKC"), salt, KEY_LENGTH, { N: n, r, p, maxmem: MAX_MEMORY }, (error, key) =>
      error ? reject(error) : resolve(key),
    );
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await derive(password, salt, SCRYPT_N, SCRYPT_R, SCRYPT_P);
  return ["scrypt", SCRYPT_N, SCRYPT_R, SCRYPT_P, salt.toString("base64"), key.toString("base64")].join("$");
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, n, r, p, saltB64, keyB64] = stored.split("$");
  if (scheme !== "scrypt" || !saltB64 || !keyB64) return false;
  const expected = Buffer.from(keyB64, "base64");
  const actual = await derive(password, Buffer.from(saltB64, "base64"), Number(n), Number(r), Number(p));
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

let dummyHash: Promise<string> | null = null;
/** A throw-away hash so "unknown email" takes as long as "wrong password". */
export function getDummyHash(): Promise<string> {
  dummyHash ??= hashPassword(randomBytes(16).toString("hex"));
  return dummyHash;
}

const COMMON_PASSWORDS = new Set([
  "password1234", "123456789012", "qwertyuiop12", "administrator", "burgerhouse12", "letmein12345", "welcome12345",
]);

/** Returns a problem description, or null when the password is acceptable. */
export function checkPasswordStrength(password: string): string | null {
  if (password.length < 12) return "must be at least 12 characters";
  if (password.length > 128) return "must be 128 characters or fewer";
  if (COMMON_PASSWORDS.has(password.toLowerCase())) return "is too common";
  return null;
}

// ---------- session tokens ----------
export function generateSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

/** Only this hash is stored, so a copy of the database cannot be used to sign in. */
export function hashSessionToken(token: string): string {
  return createHmac("sha256", env.SESSION_SECRET).update(token).digest("hex");
}

export function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

// ---------- cookies ----------
export function readCookie(header: string | undefined, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index === -1) continue;
    if (part.slice(0, index).trim() === name) {
      try {
        return decodeURIComponent(part.slice(index + 1).trim());
      } catch {
        return null;
      }
    }
  }
  return null;
}
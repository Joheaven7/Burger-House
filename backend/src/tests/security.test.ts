import "./setup";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { checkPasswordStrength, generateSessionToken, hashPassword, hashSessionToken, readCookie, verifyPassword } from "../utils/security";
import { parsePhone } from "../utils/phone";
import { hasInternalKey } from "../middleware/security";
import type { Request } from "express";

describe("passwords", () => {
  it("verifies the right password and rejects a wrong one", async () => {
    const hash = await hashPassword("correct horse battery");
    assert.ok(hash.startsWith("scrypt$"));
    assert.ok(await verifyPassword("correct horse battery", hash));
    assert.equal(await verifyPassword("wrong password!!", hash), false);
    assert.equal(await verifyPassword("anything", "not-a-hash"), false);
  });
  it("uses a different salt every time", async () => {
    assert.notEqual(await hashPassword("same password 123"), await hashPassword("same password 123"));
  });
  it("enforces length and blocks common passwords", () => {
    assert.ok(checkPasswordStrength("short"));
    assert.ok(checkPasswordStrength("password1234"));
    assert.equal(checkPasswordStrength("a long enough passphrase"), null);
  });
});

describe("session tokens and cookies", () => {
  it("creates unique tokens and stores only a stable hash", () => {
    const a = generateSessionToken();
    assert.notEqual(a, generateSessionToken());
    assert.equal(hashSessionToken(a), hashSessionToken(a));
    assert.notEqual(hashSessionToken(a), a);
  });
  it("reads a named cookie safely", () => {
    assert.equal(readCookie("a=1; bh_session=abc%20def; b=2", "bh_session"), "abc def");
    assert.equal(readCookie("a=1", "bh_session"), null);
    assert.equal(readCookie(undefined, "bh_session"), null);
  });
});

describe("phone numbers", () => {
  it("normalises Ethiopian numbers to E.164", () => {
    assert.equal(parsePhone("0911 234 567", "ET"), "+251911234567");
    assert.equal(parsePhone("+251 911 234 567", "ET"), "+251911234567");
  });
  it("rejects invalid numbers", () => {
    assert.equal(parsePhone("123", "ET"), null);
    assert.equal(parsePhone("not a phone", "ET"), null);
  });
});


describe("internal key", () => {
  const request = (value?: string) => ({ get: (name: string) => (name === "x-internal-key" ? value : undefined) }) as unknown as Request;
  it("accepts only the exact shared secret", () => {
    assert.ok(hasInternalKey(request("internal-key-internal-key-internal-key-1")));
    assert.equal(hasInternalKey(request("internal-key-internal-key-internal-key-2")), false);
    assert.equal(hasInternalKey(request("short")), false);
    assert.equal(hasInternalKey(request(undefined)), false);
  });
});
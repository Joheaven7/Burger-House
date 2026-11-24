import "./setup";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { AppError } from "../utils/errors";
import { createOrderSchema, loginSchema, menuItemUpdateSchema, parseOrThrow, settingsUpdateSchema } from "../validators";

const validOrder = {
  items: [{ itemId: "abc", quantity: 1 }], orderType: "pickup", customerName: "Abel", phone: "0911234567", expectedTotalMinor: 28000,
};

describe("request validation", () => {
  it("accepts a valid order and trims text", () => {
    const parsed = parseOrThrow(createOrderSchema, { ...validOrder, customerName: "  Abel  " });
    assert.equal(parsed.customerName, "Abel");
  });
  it("rejects unknown keys, control characters and bad totals", () => {
    assert.throws(() => parseOrThrow(createOrderSchema, { ...validOrder, role: "admin" }), AppError);
    assert.throws(() => parseOrThrow(createOrderSchema, { ...validOrder, customerName: "Ab\u0000el" }), AppError);
    assert.throws(() => parseOrThrow(createOrderSchema, { ...validOrder, expectedTotalMinor: 12.5 }), AppError);
    assert.throws(() => parseOrThrow(createOrderSchema, { ...validOrder, items: [] }), AppError);
  });
  it("rejects operator objects where strings are expected", () => {
    assert.throws(() => parseOrThrow(loginSchema, { email: { $gt: "" }, password: "x" }), AppError);
  });
  it("reports field-level details with a stable code", () => {
    try {
      parseOrThrow(createOrderSchema, { ...validOrder, customerName: "" });
      assert.fail("should have thrown");
    } catch (error) {
      assert.ok(error instanceof AppError);
      assert.equal(error.code, "VALIDATION_FAILED");
      assert.equal(error.status, 422);
    }
  });
  it("PATCH schemas do not fill in defaults, so a partial update cannot overwrite other fields", () => {
    assert.deepEqual(parseOrThrow(menuItemUpdateSchema, { available: false }), { available: false });
  });
  it("only accepts https images from allowed hosts", () => {
    assert.ok(parseOrThrow(menuItemUpdateSchema, { imageUrl: "https://images.example.com/a.jpg" }));
    assert.throws(() => parseOrThrow(menuItemUpdateSchema, { imageUrl: "https://evil.example.org/a.jpg" }), AppError);
    assert.throws(() => parseOrThrow(menuItemUpdateSchema, { imageUrl: "http://images.example.com/a.jpg" }), AppError);
  });
  it("validates settings values", () => {
    assert.ok(parseOrThrow(settingsUpdateSchema, { currency: "ETB", timezone: "Africa/Addis_Ababa", minimumOrderMinor: null }));
    assert.throws(() => parseOrThrow(settingsUpdateSchema, { currency: "XXQ" }), AppError);
    assert.throws(() => parseOrThrow(settingsUpdateSchema, { timezone: "Nowhere/City" }), AppError);
    assert.throws(() => parseOrThrow(settingsUpdateSchema, { deliveryFeeMinor: -1 }), AppError);
    assert.throws(() => parseOrThrow(settingsUpdateSchema, { openingHours: [{ day: 1, open: "10:00", close: "10:00" }] }), AppError);
  });
});
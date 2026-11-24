import "./integration-setup";
import assert from "node:assert/strict";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { after, before, describe, it } from "node:test";
import mongoose from "mongoose";
import { createApp } from "../app";
import { connectDatabase, disconnectDatabase } from "../config/db";
import { AdminSession } from "../models/admin";
import { MenuCategory, MenuItem } from "../models/menu";
import { Order, OrderStatusHistory } from "../models/order";
import { SettingsModel } from "../models/settings";
import { upsertAdmin } from "../services/auth.service";
import { getSettings } from "../services/settings.service";

// These tests use a REAL MongoDB (a "-test" database) because the riskiest code (transactions, races, sessions) cannot be mocked.
let server: Server;
let base = "";
const ids: Record<string, string> = {};
const ADMIN = { email: "owner@example.com", password: "a long enough passphrase" };

const headers = (extra: Record<string, string> = {}) => ({
  "Content-Type": "application/json",
  Origin: "http://localhost:3000",
  "X-Requested-With": "burger-house",
  ...extra,
});

async function call(method: string, path: string, options: { body?: unknown; key?: string; cookie?: string } = {}) {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: headers({ ...(options.key ? { "Idempotency-Key": options.key } : {}), ...(options.cookie ? { Cookie: options.cookie } : {}) }),
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const json = (await res.json().catch(() => null)) as { data?: any; error?: { code: string; details?: any }; pagination?: any } | null;
  return { status: res.status, json, headers: res.headers };
}

const key = () => crypto.randomUUID();
const phone = (n: number) => `0911${String(n).padStart(6, "0")}`; // valid Ethiopian mobile numbers
const order = (overrides: Record<string, unknown> = {}) => ({
  items: [{ itemId: ids.burger, quantity: 2 }],
  orderType: "pickup",
  customerName: "Test Customer",
  phone: phone(1),
  expectedTotalMinor: 56000,
  ...overrides,
});

async function resetData() {
  await Promise.all(mongoose.modelNames().map((name) => mongoose.model(name).deleteMany({})));
  const category = await MenuCategory.create({ name: "Burgers", slug: "burgers", sortOrder: 1 });
  const hidden = await MenuCategory.create({ name: "Hidden", slug: "hidden", sortOrder: 2, active: false });
  const burger = await MenuItem.create({ name: "Burger", categoryId: category._id, priceMinor: 28000 });
  const soldOut = await MenuItem.create({ name: "Sold Out Burger", categoryId: category._id, priceMinor: 30000, available: false });
  const archived = await MenuItem.create({ name: "Archived Burger", categoryId: category._id, priceMinor: 10000, active: false });
  const inHidden = await MenuItem.create({ name: "In Hidden Category", categoryId: hidden._id, priceMinor: 10000 });
  Object.assign(ids, { category: String(category._id), burger: String(burger._id), soldOut: String(soldOut._id), archived: String(archived._id), inHidden: String(inHidden._id) });
  await getSettings();
  await SettingsModel.updateOne({ key: "main" }, { $set: { deliveryEnabled: true, deliveryFeeMinor: 5000, currency: "ETB" } });
  await upsertAdmin(ADMIN.email, ADMIN.password);
}

async function signIn(): Promise<string> {
  const res = await call("POST", "/auth/login", { body: ADMIN });
  assert.equal(res.status, 200);
  const cookie = res.headers.getSetCookie().find((c) => c.startsWith("bh_session="));
  assert.ok(cookie, "session cookie was set");
  assert.ok(/HttpOnly/i.test(cookie), "cookie is HttpOnly");
  assert.ok(/SameSite=Lax/i.test(cookie), "cookie is SameSite=Lax");
  return cookie.split(";")[0];
}

before(async () => {
  await connectDatabase();
  server = createApp().listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api`;
});
after(async () => {
  server.close();
  await disconnectDatabase();
});

describe("public menu", () => {
  before(resetData);
  it("hides archived items and items in hidden categories, and flags sold-out items", async () => {
    const res = await call("GET", "/menu");
    const names = res.json!.data.map((i: { name: string }) => i.name).sort();
    assert.deepEqual(names, ["Burger", "Sold Out Burger"]);
    assert.equal(res.json!.data.find((i: { name: string }) => i.name === "Sold Out Burger").available, false);
    assert.equal((await call("GET", `/menu/${ids.archived}`)).status, 404);
    assert.equal((await call("GET", "/menu/not-an-id")).status, 404);
    assert.equal((await call("GET", "/menu?category=hidden")).json!.data.length, 0);
  });
});

describe("ordering", () => {
  before(resetData);

  it("quotes prices from the database and reports conflicts", async () => {
    const ok = await call("POST", "/orders/quote", { body: { items: [{ itemId: ids.burger, quantity: 2 }], orderType: "delivery" } });
    assert.equal(ok.json!.data.totalMinor, 61000);
    const bad = await call("POST", "/orders/quote", { body: { items: [{ itemId: ids.soldOut, quantity: 1 }, { itemId: ids.archived, quantity: 1 }] } });
    assert.deepEqual(bad.json!.data.conflicts.map((c: { reason: string }) => c.reason), ["unavailable", "removed"]);
  });

  it("creates an order with snapshots, history and no address for pickup", async () => {
    const res = await call("POST", "/orders", { key: key(), body: order({ phone: phone(2), address: "ignored for pickup" }) });
    assert.equal(res.status, 201);
    assert.match(res.json!.data.orderNumber, /^BH-\d{6}-0001$/);
    assert.equal(res.json!.data.totalMinor, 56000);
    assert.equal("phone" in res.json!.data, false, "the confirmation never exposes the phone number");
    const saved = await Order.findOne({ orderNumber: res.json!.data.orderNumber }).lean();
    assert.equal(saved?.address, undefined);
    assert.equal(saved?.phoneE164, "+251911000002");
    assert.equal(saved?.items[0].nameSnapshot, "Burger");
    assert.equal(await OrderStatusHistory.countDocuments({ orderId: saved?._id }), 1);
  });

  it("replays the same Idempotency-Key without creating a second order, and rejects a changed payload", async () => {
    const k = key();
    const before = await Order.countDocuments();
    const first = await call("POST", "/orders", { key: k, body: order({ phone: phone(3) }) });
    const second = await call("POST", "/orders", { key: k, body: order({ phone: phone(3) }) });
    assert.equal(first.status, 201);
    assert.equal(second.status, 200);
    assert.equal(first.json!.data.orderNumber, second.json!.data.orderNumber);
    assert.equal(await Order.countDocuments(), before + 1);
    const changed = await call("POST", "/orders", { key: k, body: order({ phone: phone(3), customerName: "Someone Else" }) });
    assert.equal(changed.status, 409);
    assert.equal(changed.json!.error!.code, "IDEMPOTENCY_CONFLICT");
  });

  it("creates exactly one order when identical requests arrive at the same moment", async () => {
    const k = key();
    const before = await Order.countDocuments();
    const results = await Promise.all(Array.from({ length: 6 }, () => call("POST", "/orders", { key: k, body: order({ phone: phone(4) }) })));
    assert.ok(results.every((r) => r.status === 200 || r.status === 201), JSON.stringify(results.map((r) => r.status)));
    assert.equal(new Set(results.map((r) => r.json!.data.orderNumber)).size, 1);
    assert.equal(await Order.countDocuments(), before + 1);
  });

  it("gives every simultaneous order its own number (no gaps, no duplicates)", async () => {
    await resetData();
    const results = await Promise.all(Array.from({ length: 10 }, (_, i) => call("POST", "/orders", { key: key(), body: order({ phone: phone(100 + i) }) })));
    assert.ok(results.every((r) => r.status === 201), JSON.stringify(results.map((r) => r.status)));
    const numbers = results.map((r) => r.json!.data.orderNumber as string).sort();
    assert.equal(new Set(numbers).size, 10);
    assert.deepEqual(numbers.map((n) => Number(n.slice(-4))), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it("rejects a changed price, sold-out items, invalid phone and a 4th order per phone per hour", async () => {
    assert.equal((await call("POST", "/orders", { key: key(), body: order({ phone: phone(5), expectedTotalMinor: 1 }) })).json!.error!.code, "MENU_PRICE_CHANGED");
    assert.equal((await call("POST", "/orders", { key: key(), body: order({ phone: phone(5), items: [{ itemId: ids.soldOut, quantity: 1 }], expectedTotalMinor: 30000 }) })).json!.error!.code, "MENU_ITEM_UNAVAILABLE");
    const invalid = await call("POST", "/orders", { key: key(), body: order({ phone: "123" }) });
    assert.equal(invalid.status, 422);
    assert.equal(invalid.json!.error!.details[0].path, "phone");
    assert.equal((await call("POST", "/orders", { key: key(), body: order({ phone: phone(6), orderType: "delivery" }) })).json!.error!.details[0].path, "address");
    for (let i = 0; i < 3; i += 1) assert.equal((await call("POST", "/orders", { key: key(), body: order({ phone: phone(7) }) })).status, 201);
    assert.equal((await call("POST", "/orders", { key: key(), body: order({ phone: phone(7) }) })).status, 429);
  });

  it("blocks ordering when paused or closed", async () => {
    await SettingsModel.updateOne({ key: "main" }, { $set: { ordersPaused: true } });
    assert.equal((await call("POST", "/orders", { key: key(), body: order({ phone: phone(8) }) })).json!.error!.code, "ORDERING_UNAVAILABLE");
    await SettingsModel.updateOne({ key: "main" }, { $set: { ordersPaused: false, enforceOpeningHours: true, openingHours: [] } });
    const quote = await call("POST", "/orders/quote", { body: { items: [{ itemId: ids.burger, quantity: 1 }] } });
    assert.equal(quote.json!.data.block.code, "ORDERING_CLOSED");
    await SettingsModel.updateOne({ key: "main" }, { $set: { enforceOpeningHours: false } });
  });
});

describe("admin sign-in", () => {
  before(resetData);

  it("signs in, authorises requests, and signs out", async () => {
    assert.equal((await call("GET", "/admin/stats")).status, 401);
    const cookie = await signIn();
    assert.equal((await call("GET", "/auth/me", { cookie })).json!.data.admin.email, ADMIN.email);
    assert.equal((await call("GET", "/admin/stats", { cookie })).status, 200);
    await call("POST", "/auth/logout", { cookie });
    assert.equal((await call("GET", "/auth/me", { cookie })).status, 401);
  });

  it("gives the same answer for a wrong password and an unknown email", async () => {
    const wrong = await call("POST", "/auth/login", { body: { email: ADMIN.email, password: "wrong password here" } });
    const unknown = await call("POST", "/auth/login", { body: { email: "nobody@example.com", password: "wrong password here" } });
    assert.equal(wrong.status, 401);
    assert.equal(unknown.status, 401);
    assert.equal(wrong.json!.error!.code, unknown.json!.error!.code);
    assert.equal((wrong.json!.error as { message?: string }).message, (unknown.json!.error as { message?: string }).message);
  });

  it("locks the account after 5 wrong passwords, even for the right password", async () => {
    await resetData();
    for (let i = 0; i < 5; i += 1) await call("POST", "/auth/login", { body: { email: ADMIN.email, password: "wrong password here" } });
    assert.equal((await call("POST", "/auth/login", { body: ADMIN })).status, 401);
  });

  it("ends a session after the idle limit", async () => {
    await resetData();
    const cookie = await signIn();
    await AdminSession.updateMany({}, { $set: { lastSeenAt: new Date(Date.now() - 3 * 60 * 60 * 1000) } });
    assert.equal((await call("GET", "/auth/me", { cookie })).status, 401);
  });
});

describe("admin order handling", () => {
  let cookie = "";
  let orderId = "";
  before(async () => {
    await resetData();
    cookie = await signIn();
    const created = await call("POST", "/orders", { key: key(), body: order({ phone: phone(9) }) });
    orderId = String((await Order.findOne({ orderNumber: created.json!.data.orderNumber }))!._id);
  });

  it("moves an order through valid steps and records history", async () => {
    const ok = await call("PATCH", `/orders/${orderId}/status`, { cookie, body: { expectedStatus: "pending", newStatus: "preparing" } });
    assert.equal(ok.status, 200);
    assert.equal(ok.json!.data.status, "preparing");
    assert.equal(ok.json!.data.history.length, 2);
    assert.equal(ok.json!.data.history[1].changedBy, ADMIN.email);
  });

  it("rejects stale, skipped and reason-less changes", async () => {
    const stale = await call("PATCH", `/orders/${orderId}/status`, { cookie, body: { expectedStatus: "pending", newStatus: "preparing" } });
    assert.equal(stale.json!.error!.code, "INVALID_STATUS_TRANSITION");
    const skip = await call("PATCH", `/orders/${orderId}/status`, { cookie, body: { expectedStatus: "preparing", newStatus: "completed" } });
    assert.equal(skip.status, 409);
    const noReason = await call("PATCH", `/orders/${orderId}/status`, { cookie, body: { expectedStatus: "preparing", newStatus: "cancelled" } });
    assert.equal(noReason.status, 422);
  });

  it("lets only one of two simultaneous changes win", async () => {
    const created = await call("POST", "/orders", { key: key(), body: order({ phone: phone(10) }) });
    const id = String((await Order.findOne({ orderNumber: created.json!.data.orderNumber }))!._id);
    const [a, b] = await Promise.all([
      call("PATCH", `/orders/${id}/status`, { cookie, body: { expectedStatus: "pending", newStatus: "preparing" } }),
      call("PATCH", `/orders/${id}/status`, { cookie, body: { expectedStatus: "pending", newStatus: "cancelled", reason: "Duplicate" } }),
    ]);
    assert.deepEqual([a.status, b.status].sort(), [200, 409]);
    assert.equal(await OrderStatusHistory.countDocuments({ orderId: id }), 2);
  });

  it("reports today's numbers and excludes cancelled orders from revenue", async () => {
    const stats = (await call("GET", "/admin/stats", { cookie })).json!.data;
    assert.equal(stats.ordersToday, 2);
    assert.equal(stats.byStatus.cancelled + stats.byStatus.preparing, 2);
    const expected = (await Order.find({ status: { $ne: "cancelled" } }).lean()).reduce((sum, o) => sum + o.totalMinor, 0);
    assert.equal(stats.revenueMinor, expected);
  });

  it("searches and filters the order list", async () => {
    const all = await call("GET", "/orders?pageSize=1", { cookie });
    assert.equal(all.json!.pagination.pageSize, 1);
    assert.equal(all.json!.data.length, 1);
    assert.ok(all.json!.pagination.total >= 2);
    const byPhone = await call("GET", "/orders?q=251911000009", { cookie });
    assert.equal(byPhone.json!.data.length, 1);
    const byNumber = await call("GET", `/orders?q=${encodeURIComponent(byPhone.json!.data[0].orderNumber)}`, { cookie });
    assert.equal(byNumber.json!.data.length, 1);
    // which of the two simultaneous changes won is random, so compare with the database instead of a fixed number
    for (const status of ["cancelled", "preparing"] as const) {
      const expected = await Order.countDocuments({ status });
      assert.equal((await call("GET", `/orders?status=${status}`, { cookie })).json!.data.length, expected);
    }
  });
});

describe("admin menu", () => {
  let cookie = "";
  before(async () => {
    await resetData();
    cookie = await signIn();
  });

  it("archives items that were ordered and deletes items that never were", async () => {
    await call("POST", "/orders", { key: key(), body: order({ phone: phone(11) }) });
    const unused = await call("POST", "/admin/menu", { cookie, body: { name: "Never Ordered", categoryId: ids.category, priceMinor: 5000 } });
    assert.equal(unused.status, 201);
    assert.equal((await call("DELETE", `/admin/menu/${unused.json!.data.id}`, { cookie })).json!.data.result, "deleted");
    const archived = await call("DELETE", `/admin/menu/${ids.burger}`, { cookie });
    assert.equal(archived.json!.data.result, "archived");
    assert.equal((await call("GET", `/menu/${ids.burger}`)).status, 404);
  });

  it("only changes the fields that were sent, and applies settings changes to ordering", async () => {
    const before = await MenuItem.findById(ids.soldOut).lean();
    await call("PATCH", `/admin/menu/${ids.soldOut}`, { cookie, body: { available: true } });
    const after = await MenuItem.findById(ids.soldOut).lean();
    assert.equal(after?.available, true);
    assert.equal(after?.priceMinor, before?.priceMinor);
    assert.equal(after?.name, before?.name);
    const fee = await call("PATCH", "/admin/settings", { cookie, body: { deliveryFeeMinor: 7000 } });
    assert.equal(fee.json!.data.deliveryFeeMinor, 7000);
    assert.equal((await call("PATCH", "/admin/settings", { cookie, body: { currency: "XXQ" } })).status, 422);
    assert.equal((await call("GET", "/settings/public")).json!.data.deliveryFeeMinor, 7000);
  });
});
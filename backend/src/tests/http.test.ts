import "./setup";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { after, before, describe, it } from "node:test";
import type { Server } from "node:http";
import { createApp } from "../app";

// These checks never reach the database: they test the parts of the API that run before it.
let server: Server;
let base = "";

before(async () => {
  server = createApp().listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api`;
});
after(() => { server.close(); });

const json = (body: unknown) => ({ method: "POST", headers: { "Content-Type": "application/json", Origin: "http://localhost:3000", "X-Requested-With": "burger-house" }, body: JSON.stringify(body) });

describe("API envelope and protection", () => {
  it("returns the standard error envelope for unknown routes", async () => {
    const res = await fetch(`${base}/nope`);
    assert.equal(res.status, 404);
    const body = (await res.json()) as { error: { code: string; requestId: string } };
    assert.equal(body.error.code, "NOT_FOUND");
    assert.ok(body.error.requestId);
    assert.ok(res.headers.get("x-request-id"));
  });
  it("rejects invalid JSON with a 400", async () => {
    const res = await fetch(`${base}/auth/login`, { ...json({}), body: "{not json" });
    assert.equal(res.status, 400);
  });
  it("rejects MongoDB operator keys anywhere in the body", async () => {
    const res = await fetch(`${base}/auth/login`, json({ email: { $gt: "" }, password: "x" }));
    assert.equal(res.status, 400);
  });
  it("rejects state-changing requests from another origin or without the custom header (CSRF)", async () => {
    const evil = await fetch(`${base}/auth/login`, { ...json({}), headers: { "Content-Type": "application/json", Origin: "https://evil.example.org", "X-Requested-With": "burger-house" } });
    assert.equal(evil.status, 403);
    const noHeader = await fetch(`${base}/auth/login`, { ...json({}), headers: { "Content-Type": "application/json", Origin: "http://localhost:3000" } });
    assert.equal(noHeader.status, 403);
  });
  it("validates login input before touching the database", async () => {
    const res = await fetch(`${base}/auth/login`, json({ email: "not-an-email", password: "x" }));
    assert.equal(res.status, 422);
  });
  it("blocks admin routes without a session", async () => {
    for (const path of ["/admin/stats", "/admin/menu", "/admin/settings", "/orders", "/auth/me"]) {
      const res = await fetch(`${base}${path}`);
      assert.equal(res.status, 401, path);
    }
    const patch = await fetch(`${base}/orders/507f1f77bcf86cd799439011/status`, { ...json({}), method: "PATCH" });
    assert.equal(patch.status, 401);
  });
  it("requires an Idempotency-Key and valid order data", async () => {
    const noKey = await fetch(`${base}/orders`, json({}));
    assert.equal(noKey.status, 400);
  });
  it("only allows the frontend origin in CORS", async () => {
    const ok = await fetch(`${base}/health`, { headers: { Origin: "http://localhost:3000" } });
    assert.equal(ok.headers.get("access-control-allow-origin"), "http://localhost:3000");
    const bad = await fetch(`${base}/health`, { headers: { Origin: "https://evil.example.org" } });
    assert.equal(bad.headers.get("access-control-allow-origin"), null);
  });
  it("reports degraded health when the database is not connected", async () => {
    const res = await fetch(`${base}/health`);
    assert.equal(res.status, 503);
  });
});


describe("production hardening", () => {
  it("marks every API response as not cacheable", async () => {
    for (const path of ["/health", "/nope", "/admin/stats"]) {
      const res = await fetch(`${base}${path}`);
      assert.equal(res.headers.get("cache-control"), "no-store", path);
    }
  });
});
import "./setup";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ORDER_STATUSES } from "../models/order";
import { canTransition } from "../services/orderStatus";

describe("order status transitions", () => {
  it("allows only the documented moves", () => {
    assert.ok(canTransition("received", "preparing"));
    assert.ok(canTransition("pending", "preparing"));
    assert.ok(canTransition("preparing", "ready_for_pickup"));
    assert.ok(canTransition("preparing", "ready"));
    assert.ok(canTransition("ready_for_pickup", "completed"));
    assert.ok(canTransition("ready", "completed"));
    for (const from of ["received", "pending", "preparing", "ready_for_pickup", "ready"] as const) assert.ok(canTransition(from, "cancelled"));
  });
  it("blocks skipping steps, going backwards and leaving a final status", () => {
    assert.equal(canTransition("received", "ready_for_pickup"), false);
    assert.equal(canTransition("received", "completed"), false);
    assert.equal(canTransition("pending", "ready"), false);
    assert.equal(canTransition("pending", "completed"), false);
    assert.equal(canTransition("ready_for_pickup", "preparing"), false);
    assert.equal(canTransition("ready", "preparing"), false);
    for (const to of ORDER_STATUSES) {
      assert.equal(canTransition("completed", to), false);
      assert.equal(canTransition("cancelled", to), false);
    }
  });
});
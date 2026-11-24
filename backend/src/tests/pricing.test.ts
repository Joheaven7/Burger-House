import "./setup";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildQuote, type PricingItem, type PricingSettings } from "../services/pricing";

const settings: PricingSettings = {
  currency: "ETB", locale: "en", ordersPaused: false, orderingClosed: false, pickupEnabled: true,
  deliveryEnabled: true, deliveryFeeMinor: 5000, minimumOrderMinor: null, maxQuantityPerLine: 10, maxItemsPerOrder: 30,
};
const items: PricingItem[] = [
  { id: "a", name: "Burger", priceMinor: 28000, available: true },
  { id: "b", name: "Fries", priceMinor: 12000, available: true },
  { id: "c", name: "Shake", priceMinor: 18000, available: false },
];

describe("buildQuote", () => {
  it("prices lines from database prices and adds the delivery fee only for delivery", () => {
    const pickup = buildQuote(settings, items, { lines: [{ itemId: "a", quantity: 2 }, { itemId: "b", quantity: 1 }], orderType: "pickup" });
    assert.equal(pickup.subtotalMinor, 68000);
    assert.equal(pickup.totalMinor, 68000);
    assert.equal(pickup.block, null);
    const delivery = buildQuote(settings, items, { lines: [{ itemId: "a", quantity: 2 }], orderType: "delivery" });
    assert.equal(delivery.deliveryFeeMinor, 5000);
    assert.equal(delivery.totalMinor, 61000);
  });

  it("reports removed, unavailable and invalid-quantity items as conflicts", () => {
    const q = buildQuote(settings, items, { lines: [{ itemId: "zzz", quantity: 1 }, { itemId: "c", quantity: 1 }, { itemId: "a", quantity: 1.5 }] });
    assert.deepEqual(q.conflicts.map((c) => c.reason), ["removed", "unavailable", "quantity_limit"]);
    assert.equal(q.block?.code, "ITEMS_UNAVAILABLE");
  });

  it("merges duplicate lines so the per-line limit cannot be bypassed", () => {
    const q = buildQuote(settings, items, { lines: [{ itemId: "a", quantity: 6 }, { itemId: "a", quantity: 6 }] });
    assert.equal(q.conflicts[0]?.reason, "quantity_limit");
  });

  it("rejects negative quantities even when another line would cancel them out", () => {
    const q = buildQuote(settings, items, { lines: [{ itemId: "a", quantity: 5 }, { itemId: "a", quantity: -3 }] });
    assert.equal(q.conflicts[0]?.reason, "quantity_limit");
  });

  it("blocks for pause, closed, empty cart, too many items, disabled type and minimum order", () => {
    const one = [{ itemId: "a", quantity: 1 }];
    assert.equal(buildQuote({ ...settings, ordersPaused: true }, items, { lines: one }).block?.code, "ORDERING_PAUSED");
    assert.equal(buildQuote({ ...settings, orderingClosed: true }, items, { lines: one }).block?.code, "ORDERING_CLOSED");
    assert.equal(buildQuote(settings, items, { lines: [] }).block?.code, "EMPTY_CART");
    const many = [{ itemId: "a", quantity: 10 }, { itemId: "b", quantity: 10 }, { itemId: "a", quantity: 0 }];
    assert.equal(buildQuote({ ...settings, maxItemsPerOrder: 15 }, items, { lines: many.slice(0, 2) }).block?.code, "TOO_MANY_ITEMS");
    assert.equal(buildQuote({ ...settings, deliveryEnabled: false }, items, { lines: one, orderType: "delivery" }).block?.code, "ORDER_TYPE_DISABLED");
    const min = buildQuote({ ...settings, minimumOrderMinor: 50000 }, items, { lines: one });
    assert.equal(min.block?.code, "BELOW_MINIMUM");
    assert.equal(min.block?.minimumOrderMinor, 50000);
  });
});
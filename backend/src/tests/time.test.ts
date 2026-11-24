import "./setup";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isOpenNow, isValidTimeZone, localDateString, localDayRange } from "../utils/time";

const ADDIS = "Africa/Addis_Ababa"; // UTC+3, no daylight saving

describe("restaurant-local time", () => {
  it("knows which timezones are real", () => {
    assert.ok(isValidTimeZone(ADDIS));
    assert.equal(isValidTimeZone("Mars/Olympus"), false);
  });
  it("uses the local calendar day, not the UTC day", () => {
    // 22:30 UTC on 1 Nov is already 01:30 on 2 Nov in Addis Ababa
    assert.equal(localDateString(new Date("2026-11-01T22:30:00Z"), ADDIS), "2026-11-02");
    const range = localDayRange("2026-11-02", ADDIS);
    assert.equal(range.start.toISOString(), "2026-11-01T21:00:00.000Z");
    assert.equal(range.end.toISOString(), "2026-11-02T21:00:00.000Z");
  });
  it("handles a timezone with daylight saving (23-hour day)", () => {
    const range = localDayRange("2026-03-08", "America/New_York");
    assert.equal((range.end.getTime() - range.start.getTime()) / 3600000, 23);
  });
  it("checks opening hours, including ranges that pass midnight", () => {
    const hours = [{ day: 1, open: "10:00", close: "22:00" }, { day: 5, open: "18:00", close: "02:00" }];
    // Monday 2026-11-02 12:00 local = 09:00 UTC
    assert.ok(isOpenNow(hours, new Date("2026-11-02T09:00:00Z"), ADDIS));
    // Monday 23:00 local is closed
    assert.equal(isOpenNow(hours, new Date("2026-11-02T20:00:00Z"), ADDIS), false);
    // Friday 2026-11-06 23:00 local is open (18:00 to 02:00), and Saturday 01:00 local is still open
    assert.ok(isOpenNow(hours, new Date("2026-11-06T20:00:00Z"), ADDIS));
    assert.ok(isOpenNow(hours, new Date("2026-11-06T22:00:00Z"), ADDIS));
    assert.equal(isOpenNow(hours, new Date("2026-11-06T23:30:00Z"), ADDIS), false);
    assert.equal(isOpenNow([], new Date(), ADDIS), false);
  });
});
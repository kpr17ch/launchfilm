import { describe, expect, it } from "vitest";
import {
  BLACK,
  contrast,
  flatten,
  hueDistance,
  isNeutral,
  mix,
  parseColor,
  readableOn,
  toHex,
  toHsl,
  WHITE,
} from "../src/brand/color.ts";

describe("parseColor", () => {
  it.each([
    ["#fff", { r: 255, g: 255, b: 255, a: 1 }],
    ["#7c5cff", { r: 124, g: 92, b: 255, a: 1 }],
    ["#7c5cff80", { r: 124, g: 92, b: 255, a: 128 / 255 }],
    ["rgb(10, 11, 20)", { r: 10, g: 11, b: 20, a: 1 }],
    ["rgba(10, 11, 20, 0.5)", { r: 10, g: 11, b: 20, a: 0.5 }],
    ["rgb(10 11 20 / 50%)", { r: 10, g: 11, b: 20, a: 0.5 }],
    ["transparent", { r: 0, g: 0, b: 0, a: 0 }],
  ])("parses %s", (input, expected) => {
    expect(parseColor(input)).toEqual(expected);
  });

  it.each(["", "blue", "#12", "hsl(10, 20%, 30%)", "rgb(1, 2)", null, undefined])("rejects %s", (input) => {
    expect(parseColor(input)).toBeNull();
  });
});

describe("contrast", () => {
  it("is 21 between black and white and symmetric", () => {
    expect(contrast(BLACK, WHITE)).toBeCloseTo(21, 5);
    expect(contrast(WHITE, BLACK)).toBeCloseTo(21, 5);
  });

  it("picks the more readable text color", () => {
    expect(readableOn(parseColor("#0a0b14")!)).toBe(WHITE);
    expect(readableOn(parseColor("#ffe066")!)).toBe(BLACK);
  });
});

describe("helpers", () => {
  it("treats greys, near-black and near-white as neutral", () => {
    expect(isNeutral(parseColor("#808080")!)).toBe(true);
    expect(isNeutral(parseColor("#050505")!)).toBe(true);
    expect(isNeutral(parseColor("#fbfbfd")!)).toBe(true);
    expect(isNeutral(parseColor("#7c5cff")!)).toBe(false);
  });

  it("measures hue distance on the circle", () => {
    expect(hueDistance(parseColor("#ff0000")!, parseColor("#ff0044")!)).toBeLessThan(20);
    expect(hueDistance(parseColor("#ff0000")!, parseColor("#00ffff")!)).toBeCloseTo(180, 0);
  });

  it("flattens translucent colors onto a backdrop", () => {
    expect(toHex(flatten({ r: 0, g: 0, b: 0, a: 0.5 }, WHITE))).toBe("#808080");
  });

  it("mixes linearly", () => {
    expect(toHex(mix(BLACK, WHITE, 0.5))).toBe("#808080");
  });

  it("round-trips through HSL", () => {
    const hsl = toHsl(parseColor("#7c5cff")!);
    expect(hsl.h).toBeGreaterThan(250);
    expect(hsl.h).toBeLessThan(260);
    expect(hsl.s).toBeCloseTo(1, 2);
  });
});

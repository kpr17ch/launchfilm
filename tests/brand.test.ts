import { describe, expect, it } from "vitest";
import { extractBrand, extractName, pickLogo, primaryFamily } from "../src/brand/extract.ts";
import { rawPage } from "./fixtures/raw.ts";

describe("extractBrand", () => {
  const brand = extractBrand(rawPage());

  it("detects a dark page and its background", () => {
    expect(brand.dark).toBe(true);
    expect(brand.palette.background).toBe("#0a0b14");
  });

  it("takes the primary color from the filled call-to-action", () => {
    expect(brand.palette.primary).toBe("#7c5cff");
    expect(brand.palette.onPrimary).toBe("#ffffff");
  });

  it("finds a second brand hue for the accent", () => {
    expect(brand.palette.accent).toBe("#2ee6c5");
  });

  it("uses the dominant high-contrast text color as foreground and a neutral muted tone", () => {
    expect(brand.palette.foreground).toBe("#eef0ff");
    expect(brand.palette.muted).not.toBe(brand.palette.foreground);
  });

  it("reads the heading font", () => {
    expect(brand.fonts).toEqual({ heading: "Manrope", body: "Manrope" });
  });

  it("falls back to a light palette and a default primary on a plain page", () => {
    const plain = extractBrand(
      rawPage({
        buttons: [],
        colors: [{ color: "rgb(255, 255, 255)", area: 1e6, kind: "background" }],
        pageBackground: "rgb(255, 255, 255)",
        meta: { ...rawPage().meta, themeColor: null },
      }),
    );
    expect(plain.dark).toBe(false);
    expect(plain.palette.background).toBe("#ffffff");
    expect(plain.palette.primary).toMatch(/^#[0-9a-f]{6}$/);
  });
});

describe("extractName", () => {
  it("prefers og:site_name", () => {
    expect(extractName(rawPage({ meta: { ...rawPage().meta, ogSiteName: "Orbit HQ" } }))).toBe("Orbit HQ");
  });

  it("matches a title segment against the domain", () => {
    expect(extractName(rawPage({ title: "Release notes that write themselves | Orbit" }))).toBe("Orbit");
  });

  it("falls back to the capitalised domain", () => {
    expect(extractName(rawPage({ title: "Welcome to the future of release notes for modern teams" }))).toBe("Orbit");
  });
});

describe("pickLogo", () => {
  it("chooses the header logo", () => {
    expect(pickLogo(rawPage(), "Orbit")?.kind).toBe("svg");
  });

  it("ignores tiny decorative icons far from the header", () => {
    const raw = rawPage({
      logos: [
        {
          kind: "img",
          src: "https://x/icon.png",
          markup: null,
          alt: "",
          x: 900,
          y: 600,
          width: 14,
          height: 14,
          inHeader: false,
        },
      ],
    });
    expect(pickLogo(raw, "Orbit")).toBeNull();
  });
});

describe("primaryFamily", () => {
  it.each([
    ['"Manrope", system-ui, sans-serif', "Manrope"],
    ["-apple-system, BlinkMacSystemFont, 'Inter Tight', sans-serif", "Inter Tight"],
    ["system-ui, sans-serif", null],
    [undefined, null],
  ])("%s → %s", (stack, expected) => {
    expect(primaryFamily(stack)).toBe(expected);
  });
});

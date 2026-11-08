/**
 * Raw facts collected from a rendered page. The collector runs inside the browser and
 * deliberately does no interpretation: brand and content extraction are pure functions
 * over this structure, which keeps them unit-testable without a browser.
 */

export interface RawHeading {
  level: 1 | 2 | 3;
  text: string;
  /** First paragraph-like text that follows the heading inside the same section. */
  body: string | null;
  /** Document-space top offset in CSS pixels. */
  y: number;
  inNav: boolean;
  inFooter: boolean;
  /** Largest visual (image, video, card, mockup) in the heading's section, in document coordinates. */
  visual: RawBox | null;
}

export interface RawBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RawButton {
  text: string;
  background: string;
  color: string;
  y: number;
  width: number;
  height: number;
  href: string | null;
}

export interface RawColorSample {
  color: string;
  /** Visible area in CSS px² (clipped to the first few viewports). */
  area: number;
  kind: "background" | "text" | "border";
}

export interface RawFont {
  family: string;
  role: "heading" | "body";
  weight: number;
}

export interface RawLogoCandidate {
  kind: "img" | "svg";
  /** Absolute URL for `img`, null for inline SVG. */
  src: string | null;
  /** Serialized markup for inline SVG (with computed fill colors inlined), null for `img`. */
  markup: string | null;
  alt: string;
  x: number;
  y: number;
  width: number;
  height: number;
  inHeader: boolean;
}

export interface RawIcon {
  href: string;
  rel: string;
  sizes: string | null;
}

export interface RawPage {
  url: string;
  title: string;
  lang: string | null;
  meta: {
    description: string | null;
    ogTitle: string | null;
    ogSiteName: string | null;
    ogImage: string | null;
    themeColor: string | null;
  };
  icons: RawIcon[];
  logos: RawLogoCandidate[];
  headings: RawHeading[];
  buttons: RawButton[];
  colors: RawColorSample[];
  fonts: RawFont[];
  /** Computed background of <body>, falling back to <html>. */
  pageBackground: string;
  viewport: { width: number; height: number };
  documentHeight: number;
}

import type { RawPage } from "./types.ts";

/**
 * Runs inside the page (via `page.evaluate`). Must stay self-contained: no imports,
 * no closures over module scope. Collects facts only; interpretation happens in Node.
 */
export function collectRawPage(): RawPage {
  const viewport = { width: window.innerWidth, height: window.innerHeight };
  const sampleDepth = viewport.height * 3;
  const clean = (text: string | null | undefined) => (text ?? "").replace(/\s+/g, " ").trim();
  const meta = (selector: string) => document.querySelector<HTMLMetaElement>(selector)?.content?.trim() || null;
  const absolute = (href: string | null) => {
    if (!href) return null;
    try {
      return new URL(href, document.baseURI).href;
    } catch {
      return null;
    }
  };

  const isVisible = (el: Element) => {
    const rect = el.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) return false;
    const style = getComputedStyle(el);
    return style.visibility !== "hidden" && style.display !== "none" && Number(style.opacity) > 0.05;
  };
  const docTop = (el: Element) => el.getBoundingClientRect().top + window.scrollY;
  const inside = (el: Element, selector: string) => el.closest(selector) !== null;
  const NAV = "nav, header, [role='navigation'], [role='banner']";
  const FOOTER = "footer, [role='contentinfo']";

  // The section's illustration: the largest image/video/card that does not contain the heading itself.
  const VISUAL =
    "img, picture, video, canvas, svg, [class*='card' i], [class*='image' i], [class*='visual' i], [class*='media' i], [class*='screenshot' i], [class*='mock' i], [class*='demo' i]";
  const findVisual = (heading: Element) => {
    const section = heading.closest("section, article") ?? heading.parentElement?.parentElement ?? null;
    if (!section) return null;
    let best: { x: number; y: number; width: number; height: number } | null = null;
    for (const node of Array.from(section.querySelectorAll(VISUAL)).slice(0, 60)) {
      if (node.contains(heading) || !isVisible(node)) continue;
      const rect = node.getBoundingClientRect();
      if (rect.width < 220 || rect.height < 140) continue;
      if (best && rect.width * rect.height <= best.width * best.height) continue;
      best = { x: rect.left + window.scrollX, y: rect.top + window.scrollY, width: rect.width, height: rect.height };
    }
    return best;
  };

  // Headings with the paragraph that explains them.
  const headings: RawPage["headings"] = [];
  for (const el of Array.from(document.querySelectorAll("h1, h2, h3"))) {
    if (!isVisible(el)) continue;
    const text = clean(el.textContent);
    if (!text) continue;
    let body: string | null = null;
    const scope = el.parentElement;
    if (scope) {
      const candidates = Array.from(scope.querySelectorAll("p"));
      const after = candidates.find(
        (p) => el.compareDocumentPosition(p) & Node.DOCUMENT_POSITION_FOLLOWING && clean(p.textContent).length > 20,
      );
      body = after ? clean(after.textContent) : null;
    }
    headings.push({
      level: Number(el.tagName.slice(1)) as 1 | 2 | 3,
      text,
      body,
      y: docTop(el),
      inNav: inside(el, NAV),
      inFooter: inside(el, FOOTER),
      visual: findVisual(el),
    });
  }

  // Button-like elements: their fill color is the strongest brand signal on most sites.
  const buttons: RawPage["buttons"] = [];
  const buttonSelector =
    "button, a[class*='btn'], a[class*='button'], a[role='button'], [class*='cta'] a, a[class*='cta']";
  for (const el of Array.from(document.querySelectorAll(buttonSelector)).slice(0, 80)) {
    if (!isVisible(el)) continue;
    const text = clean(el.textContent);
    if (!text || text.length > 40) continue;
    const rect = el.getBoundingClientRect();
    const style = getComputedStyle(el);
    buttons.push({
      text,
      background: style.backgroundColor,
      color: style.color,
      y: docTop(el),
      width: rect.width,
      height: rect.height,
      href: absolute(el.getAttribute("href")),
    });
  }

  // Color samples weighted by visible area within the first few viewports.
  const colors: RawPage["colors"] = [];
  const elements = Array.from(document.body.querySelectorAll("*")).slice(0, 2500);
  for (const el of elements) {
    const rect = el.getBoundingClientRect();
    const top = rect.top + window.scrollY;
    if (top > sampleDepth || rect.width < 4 || rect.height < 4) continue;
    const style = getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden") continue;
    const visibleHeight = Math.max(0, Math.min(rect.bottom + window.scrollY, sampleDepth) - top);
    const area = Math.min(rect.width, viewport.width) * visibleHeight;
    if (area <= 0) continue;
    colors.push({ color: style.backgroundColor, area, kind: "background" });
    const ownText = Array.from(el.childNodes).some(
      (n) => n.nodeType === Node.TEXT_NODE && clean(n.textContent).length > 1,
    );
    if (ownText) {
      const fontSize = Number.parseFloat(style.fontSize) || 16;
      colors.push({ color: style.color, area: clean(el.textContent).length * fontSize * fontSize * 0.5, kind: "text" });
    }
    if (Number.parseFloat(style.borderTopWidth) > 0) {
      colors.push({
        color: style.borderTopColor,
        area: rect.width * Number.parseFloat(style.borderTopWidth),
        kind: "border",
      });
    }
  }

  const fontOf = (el: Element | null, role: "heading" | "body") => {
    if (!el) return null;
    const style = getComputedStyle(el);
    return { family: style.fontFamily, role, weight: Number(style.fontWeight) || 400 };
  };
  const fonts = [
    fontOf(document.querySelector("h1") ?? document.querySelector("h2"), "heading"),
    fontOf(document.querySelector("p") ?? document.body, "body"),
  ].filter((f): f is NonNullable<typeof f> => f !== null);

  // Logo candidates: images or inline SVGs near the top-left, or anything named "logo".
  const logos: RawPage["logos"] = [];
  const logoNodes = Array.from(
    document.querySelectorAll(
      "header img, header svg, nav img, nav svg, a[href='/'] img, a[href='/'] svg, [class*='logo'] img, [class*='logo'] svg, img[alt*='logo' i], img[src*='logo' i]",
    ),
  );
  for (const el of logoNodes.slice(0, 20)) {
    if (!isVisible(el)) continue;
    const rect = el.getBoundingClientRect();
    if (rect.width < 12 || rect.height < 12 || rect.top > viewport.height) continue;
    if (el instanceof SVGElement && el.closest("svg") !== el) continue;
    let markup: string | null = null;
    if (el instanceof SVGSVGElement) {
      const clone = el.cloneNode(true) as SVGSVGElement;
      const source = [el, ...Array.from(el.querySelectorAll("*"))];
      const target = [clone, ...Array.from(clone.querySelectorAll("*"))];
      source.forEach((node, i) => {
        const style = getComputedStyle(node);
        const copy = target[i];
        if (!copy) return;
        if (style.fill && style.fill !== "none") copy.setAttribute("fill", style.fill);
        if (style.stroke && style.stroke !== "none") copy.setAttribute("stroke", style.stroke);
      });
      if (!clone.getAttribute("viewBox")) clone.setAttribute("viewBox", `0 0 ${rect.width} ${rect.height}`);
      clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      markup = clone.outerHTML;
    }
    logos.push({
      kind: el instanceof HTMLImageElement ? "img" : "svg",
      src: el instanceof HTMLImageElement ? absolute(el.currentSrc || el.src) : null,
      markup,
      alt: clean(el.getAttribute("alt") ?? el.getAttribute("aria-label")),
      x: rect.left,
      y: rect.top + window.scrollY,
      width: rect.width,
      height: rect.height,
      inHeader: inside(el, NAV),
    });
  }

  const icons = Array.from(document.querySelectorAll<HTMLLinkElement>("link[rel*='icon']"))
    .map((link) => ({
      href: absolute(link.getAttribute("href")) ?? "",
      rel: link.rel,
      sizes: link.getAttribute("sizes"),
    }))
    .filter((icon) => icon.href);

  const bodyBg = getComputedStyle(document.body).backgroundColor;
  const htmlBg = getComputedStyle(document.documentElement).backgroundColor;

  return {
    url: location.href,
    title: clean(document.title),
    lang: document.documentElement.lang || null,
    meta: {
      description: meta("meta[name='description']") ?? meta("meta[property='og:description']"),
      ogTitle: meta("meta[property='og:title']"),
      ogSiteName: meta("meta[property='og:site_name']"),
      ogImage: absolute(meta("meta[property='og:image']")),
      themeColor: meta("meta[name='theme-color']"),
    },
    icons,
    logos,
    headings,
    buttons,
    colors,
    fonts,
    pageBackground: bodyBg === "rgba(0, 0, 0, 0)" ? htmlBg : bodyBg,
    viewport,
    documentHeight: document.documentElement.scrollHeight,
  };
}

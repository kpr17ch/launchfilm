/** Text helpers that keep on-screen copy short without cutting words in half. */

export function truncateWords(text: string, maxChars: number): string {
  const value = text.replace(/\s+/g, " ").trim();
  if (value.length <= maxChars) return value;
  const words = value.split(" ");
  let out = "";
  for (const word of words) {
    const next = out ? `${out} ${word}` : word;
    if (next.length > maxChars - 1) break;
    out = next;
  }
  if (!out) return `${value.slice(0, maxChars - 1)}…`;
  return `${out.replace(/[,;:.\-–—]+$/, "")}…`;
}

/**
 * The longest clean unit of text that fits: the first sentence, else its first clause.
 * Returns null instead of cutting a sentence mid-thought; on-screen ellipses look broken.
 */
export function cleanClause(text: string | null | undefined, maxChars: number, minWords = 3): string | null {
  if (!text) return null;
  const value = text.replace(/\s+/g, " ").trim();
  const sentence = (value.match(/^.+?[.!?](\s|$)/)?.[0] ?? value).trim().replace(/[.!]$/, "");
  if (sentence.length <= maxChars) return sentence;
  const clause = sentence.split(/\s*[,;:–—]\s*|\s+-\s+/)[0]?.trim() ?? "";
  if (clause.length <= maxChars && wordCount(clause) >= minWords) return clause;
  return null;
}

/** Limits a line to a number of words, dropping trailing punctuation. */
export function limitWords(text: string, maxWords: number, maxChars: number): string {
  const words = text.replace(/\s+/g, " ").trim().split(" ");
  const kept = words
    .slice(0, maxWords)
    .join(" ")
    .replace(/[,;:\-–—]+$/, "");
  return kept.length <= maxChars ? kept : truncateWords(kept, maxChars);
}

export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

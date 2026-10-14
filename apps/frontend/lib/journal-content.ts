/* Single home for journal Markdown content helpers.
 *
 * Journals store one Markdown string: `# Title` on line 1, body after it.
 * These pure functions are shared by the editor, sidebar cards, search,
 * export, and home preview — do not duplicate them per component.
 */

function normalized(content: string): string {
  return (content ?? '').replace(/\r\n/g, '\n');
}

/** Raw first line with only the `#` marker stripped — never trimmed, so typed spaces survive the round-trip. */
export function splitTitleLine(content: string): string {
  const text = normalized(content);
  const lineBreak = text.indexOf('\n');
  const raw = lineBreak === -1 ? text : text.slice(0, lineBreak);
  return raw.replace(/^#+\s?/, '');
}

/** Trimmed display title (cards, topbar, search). Pair with a fallback. */
export function splitTitleDisplay(content: string): string {
  const text = normalized(content);
  const lineBreak = text.indexOf('\n');
  const raw = lineBreak === -1 ? text : text.slice(0, lineBreak);
  return raw.replace(/^#+\s*/, '').trim();
}

/** Everything after the title line, without leading blank lines. */
export function splitBody(content: string): string {
  const text = normalized(content);
  const lineBreak = text.indexOf('\n');
  if (lineBreak === -1) return '';
  return text.slice(lineBreak + 1).replace(/^\n+/, '');
}

/** Single-line plain preview of the body (or whole content when title-less). */
export function previewOf(content: string, maxLength = 160): string {
  const text = normalized(content);
  const source = splitBody(text).trim() || text.trim();
  return source.replace(/\s+/g, ' ').slice(0, maxLength);
}

/** Recombine title + body for storage. A blank title keeps its (empty)
 *  first-line slot so the body's first line is never promoted into it. */
export function composeContent(title: string, body: string): string {
  if (!title.trim()) return body ? `\n${body}` : '';
  if (!body) return `# ${title}\n`;
  return `# ${title}\n\n${body}`;
}

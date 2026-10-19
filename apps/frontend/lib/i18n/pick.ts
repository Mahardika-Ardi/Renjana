export type Lang = 'id' | 'en';

/** A bilingual pair: [indonesian, english]. */
export type Bi = readonly [string, string];

/**
 * Resolves a bilingual copy tree: every `Bi` pair collapses to a plain
 * string, arrays and nested objects resolve recursively. Lets a copy tree
 * carry full typing with no hand-written interface.
 */
export type CopyValue<T> = T extends Bi
  ? string
  : T extends readonly (infer U)[]
    ? CopyValue<U>[]
    : T extends object
      ? { [K in keyof T]: CopyValue<T[K]> }
      : T;

/** Runtime twin of `CopyValue` — picks one side of every `Bi` pair. */
export function pick<T>(node: T, lang: Lang): CopyValue<T> {
  if (Array.isArray(node) && node.length === 2 && node.every((v) => typeof v === 'string')) {
    return node[lang === 'id' ? 0 : 1] as CopyValue<T>;
  }
  if (Array.isArray(node)) {
    return node.map((item) => pick(item, lang)) as CopyValue<T>;
  }
  if (node && typeof node === 'object') {
    return Object.fromEntries(
      Object.entries(node).map(([key, value]) => [key, pick(value, lang)]),
    ) as CopyValue<T>;
  }
  return node as CopyValue<T>;
}

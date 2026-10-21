/* Home bento design tokens — one card system for the dashboard grid.
 *
 * The home page used to stack five different treatments (beige rounded-38
 * slab, gray rounded-30 card, olive rounded-30 slab, dark photo hero, a
 * narrow mood column). Every tile now derives from TILE/TILE_SAGE with a
 * single 26px radius, consistent padding, and exactly two accents:
 * brown #8a6335 (primary) and olive/sage (secondary). The dark emotion
 * dump photo stays as the grid's single dark anchor.
 *
 * Same composed-class-string pattern as lib/constants/journal
 * (PAPER_SHADOW / FLOAT_SHADOW). */

/** Warm paper page shell: light surface with dark text even when the OS
 * prefers dark color schemes (home is intentionally always light). */
export const PAPER = 'min-h-[100dvh] bg-[#faf8f5] text-[#1c1a17]';

/** Subtle hover lift, shared by the tiles (Tailwind v4 translates via the
 * standalone `translate:` property, so it never fights motion's inline
 * `transform`), guarded for prefers-reduced-motion. */
export const LIFT =
  'transition-transform duration-300 hover:-translate-y-1 ' +
  'motion-reduce:transition-none motion-reduce:hover:translate-y-0';

/** Default bento tile: white paper, hairline border, shared radius/padding. */
export const TILE = `flex flex-col rounded-[26px] border border-[#efeae2] bg-white p-6 ${LIFT}`;

/** Sage-tinted accent tile (streak) — secondary palette slot. */
export const TILE_SAGE = `flex flex-col rounded-[26px] bg-[#e9ead9] p-6 text-[#3f4524] ${LIFT}`;

/** Cubic-bezier tuple for the tile entrance (explicit 4-tuple so the value
 * satisfies motion's Easing type — a plain `number[]` would not). */
const RISE_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

/**
 * Staggered entrance for a bento tile — spread as props:
 * `<motion.div {...tileRise(index * 0.06)}>`. The parent MotionConfig uses
 * `reducedMotion="user"`, which drops the y-transform for reduced-motion
 * users and keeps only opacity.
 */
export function tileRise(delay: number) {
  return {
    initial: { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, delay, ease: RISE_EASE },
  };
}

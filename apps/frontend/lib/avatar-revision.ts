/* Session-scoped avatar cache-busting.
 *
 * Re-uploading a photo of the same format reuses the EXACT secure_url —
 * the backend overwrites a fixed Cloudinary public_id — so React sees an
 * unchanged src and the browser keeps showing its cached copy of the old
 * image. After a successful in-place overwrite we bump a revision for
 * that URL; every surface rendering it then requests `?v=n`, a fresh key
 * for both the Next image optimizer and the Cloudinary CDN (unknown
 * delivery params are ignored upstream). URLs that actually changed (and
 * other people's photos) are left untouched.
 *
 * Module state = lives for the page session (survives modal unmounts,
 * resets on reload) and is client-only, so server/pre-mount renders are
 * always revision 0 — identical HTML, no hydration risk.
 */

const revisions = new Map<string, number>();

/** Record that `url` was re-uploaded in place (identical URL). */
export function markAvatarOverwritten(url: string): void {
  revisions.set(url, (revisions.get(url) ?? 0) + 1);
}

/** Resolve an avatar URL for rendering, bypassing caches after an in-place overwrite. */
export function avatarSrc(url: string | null | undefined): string {
  if (url == null) return '/icons/user.svg';
  const revision = revisions.get(url);
  if (!revision) return url;
  return `${url}${url.includes('?') ? '&' : '?'}v=${revision}`;
}

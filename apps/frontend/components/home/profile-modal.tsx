'use client';

import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import Image from 'next/image';
import { Camera, Loader2, X } from 'lucide-react';
import { AuthUser } from '@renjana/types';
import { useMounted } from '@/lib/use-mounted';
import { useHome } from '@/components/home/home-i18n';
import { usersApi } from '@/lib/api/users';
import { avatarSrc, markAvatarOverwritten } from '@/lib/avatar-revision';

interface ProfileModalProps {
  user: AuthUser | null;
  who: 'me' | 'partner';
  onClose: () => void;
  /** Refresh the shared cached /auth/me after a successful avatar change
   *  so the modal, greeting, and connection card all pick up the new URL.
   *  (accepts `refresh()` directly — its Promise<boolean> is fine here) */
  onAvatarChange?: () => void | Promise<unknown>;
}

/** Both limits mirror the backend's avatar contract (JPG/PNG/WEBP/GIF, ≤5MB). */
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const AVATAR_MIME_TYPES = 'image/jpeg,image/png,image/webp,image/gif';
const AVATAR_MIME_SET = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

export default function ProfileModal({
  user,
  who,
  onClose,
  onAvatarChange,
}: ProfileModalProps) {
  const mounted = useMounted();
  const t = useHome();
  const isPartner = who === 'partner';
  const couple = user?.couple ?? null;

  const avatarUrl = isPartner ? (couple?.partnerAvatarUrl ?? null) : user?.avatarUrl;
  const name = isPartner ? (couple?.partnerName ?? null) : user?.name;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<'upload' | 'remove' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const previewRef = useRef<string | null>(null);

  // Object URLs must be revoked on replace and unmount.
  const replacePreview = (next: string | null) => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = next;
    setPreview(next);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
      previewRef.current = null;
    };
  }, [onClose]);

  const handlePick = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset so the same file can be picked again after a rejection/failure.
    e.target.value = '';
    if (!file || busy) return;
    setError(null);

    // Reject bad files locally — no request leaves the browser.
    if (!AVATAR_MIME_SET.has(file.type)) {
      setError(t.profile.badType);
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setError(t.profile.tooLarge);
      return;
    }

    // Optimistic: show the picked image immediately under a busy overlay.
    const urlBefore = avatarUrl;
    replacePreview(URL.createObjectURL(file));
    setBusy('upload');
    try {
      const res = await usersApi.uploadAvatar(file);
      // refresh() resolves even on failure (it swallows and sets its own
      // error state) — the 60s /auth/me poll re-syncs if this hiccups.
      await onAvatarChange?.();
      // Same-format overwrite reuses the exact secure_url (fixed
      // public_id) — mark it so every surface bypasses its cached copy
      // and the new photo shows immediately.
      const newUrl = res.data?.avatarUrl ?? null;
      if (newUrl !== null && urlBefore !== null && newUrl === urlBefore) {
        markAvatarOverwritten(newUrl);
      }
    } catch {
      setError(t.profile.uploadFailed);
    } finally {
      replacePreview(null);
      setBusy(null);
    }
  };

  const handleRemove = async () => {
    if (busy) return;
    setError(null);
    setBusy('remove');
    try {
      await usersApi.deleteAvatar();
      await onAvatarChange?.();
    } catch {
      setError(t.profile.removeFailed);
    } finally {
      setBusy(null);
    }
  };

  if (!mounted) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-[28px] bg-[#faf9f7] p-8 shadow-[0_24px_60px_rgba(60,50,40,0.22)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.16em] text-[#8a6335]">
              {isPartner ? t.profile.eyebrowPartner : t.profile.eyebrowMe}
            </p>
            <h3 className="mt-1 text-xl font-semibold tracking-[-0.03em]">
              {isPartner ? t.profile.titlePartner : t.profile.titleMe}
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label={t.profile.close}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f1eee8] text-[#4f4b43] transition-colors hover:bg-[#e8e2d8]"
          >
            <X size={16} />
          </button>
        </div>

        {/* Avatar + name */}
        <div className="flex flex-col items-center text-center">
          <div className="relative">
            <button
              type="button"
              disabled={isPartner || busy !== null}
              onClick={() => fileInputRef.current?.click()}
              aria-label={t.profile.editPhoto}
              aria-busy={busy !== null}
              className={`group relative block h-24 w-24 overflow-hidden rounded-full border-[3px] border-[#b1a082] bg-[#ddd] shadow-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#b1a082] disabled:cursor-wait ${
                isPartner ? 'cursor-default' : 'cursor-pointer'
              }`}
            >
              {preview !== null ? (
                /* eslint-disable-next-line @next/next/no-img-element --
                   local object-URL preview: never optimized, exists only
                   until the upload finishes. */
                <img
                  src={preview}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <Image
                  src={avatarSrc(avatarUrl)}
                  alt={isPartner ? t.profile.imagePartner : t.profile.imageMe}
                  className="h-full w-full object-cover"
                  height={100}
                  width={100}
                />
              )}

              {busy !== null ? (
                <span className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/45 text-white">
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                  <span className="px-2 text-center text-[9px] font-medium leading-tight">
                    {busy === 'upload'
                      ? t.profile.uploading
                      : t.profile.removing}
                  </span>
                </span>
              ) : isPartner ? null : (
                <span className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/45 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                  <Camera className="h-5 w-5" aria-hidden />
                  <span className="px-2 text-center text-[9px] font-medium leading-tight">
                    {t.profile.editPhoto}
                  </span>
                </span>
              )}
            </button>

            {!isPartner && (
              <input
                ref={fileInputRef}
                type="file"
                accept={AVATAR_MIME_TYPES}
                className="hidden"
                onChange={handlePick}
              />
            )}
          </div>

          <p className="mt-4 text-lg font-semibold tracking-[-0.02em]">
            {name ?? (isPartner ? t.profile.notConnected : '')}
          </p>

          {!isPartner && user?.email && (
            <p className="mt-1 text-sm text-[#7a756b]">{user.email}</p>
          )}

          {/* Remove photo — own profile with a stored photo only. */}
          {!isPartner && avatarUrl !== null && preview === null && (
            <button
              type="button"
              onClick={() => {
                void handleRemove();
              }}
              disabled={busy !== null}
              className="mt-2 text-[11px] font-medium text-[#8a6335] transition hover:text-[#6f4a1f] disabled:opacity-60"
            >
              {busy === 'remove' ? t.profile.removing : t.profile.removePhoto}
            </button>
          )}

          {error && (
            <p role="alert" className="mt-2 text-[11px] font-medium text-red-600">
              {error}
            </p>
          )}
        </div>

        {/* Info rows */}
        <div className="mt-6 space-y-3 rounded-2xl bg-[#f1eee8] p-5">
          {isPartner ? (
            <>
              <InfoRow label={t.profile.name} value={couple?.partnerName ?? '—'} />
              <InfoRow
                label="Streak"
                value={`${couple?.currentStreak ?? 0} ${t.profile.days}`}
              />
              <InfoRow label={t.profile.status} value={t.profile.connected} />
            </>
          ) : (
            <>
              <InfoRow label={t.profile.name} value={user?.name ?? '—'} />
              <InfoRow label={t.profile.email} value={user?.email ?? '—'} />
              <InfoRow
                label={t.profile.verified}
                value={user?.isEmailVerified ? t.profile.yes : t.profile.notYet}
              />
              {couple && (
                <InfoRow label={t.profile.partner} value={couple.partnerName ?? '—'} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-[#7a756b]">{label}</span>
      <span className="font-medium text-[#1d1d1b]">{value}</span>
    </div>
  );
}

import { api } from './client';
import type { ApiResponse } from '@renjana/types';
import { USERS_BASE_URL } from '../constants/url';

/* Profile-photo endpoints (backend users module, Cloudinary-backed).
 * Both responses echo a user row; the frontend only consumes
 * `avatarUrl` — the full cached AuthUser (incl. couple) is refetched
 * via the profile refresh, so nothing partial ever enters the cache. */
export interface AvatarUser {
  avatarUrl: string | null;
}

export const usersApi = {
  /** POST /users/avatar — multipart, field `avatar` (JPG/PNG/WEBP/GIF, ≤5MB). */
  uploadAvatar(file: File) {
    const form = new FormData();
    form.append('avatar', file);
    return api.post<ApiResponse<AvatarUser>>(
      `${USERS_BASE_URL}/avatar`,
      form,
    );
  },

  /** DELETE /users/avatar — clears the stored photo. */
  deleteAvatar() {
    return api.delete<ApiResponse<AvatarUser>>(`${USERS_BASE_URL}/avatar`);
  },
};

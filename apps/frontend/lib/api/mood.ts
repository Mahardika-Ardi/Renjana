import { api } from './client';
import type { ApiResponse } from '@renjana/types';
import { MoodEnum } from '@/lib/constants/mood';
import { MOOD_BASE_URL } from '@/lib/constants/url';

export interface MoodLog {
  id: string;
  userId: string;
  mood: MoodEnum;
  intensity: number;
  notes: string | null;
  tags: string[];
  logDate: string;
  createdAt: string;
  updatedAt: string;
  /** Included only by GET /mood/partner (relation select). */
  user?: { id: string; name: string; avatarUrl: string | null };
}

export interface MoodListResponse {
  items: MoodLog[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    message?: string | null;
  };
}

export interface CreateMoodPayload {
  mood: MoodEnum;
  logDate: string; // YYYY-MM-DD
}

export const moodApi = {
  create(payload: CreateMoodPayload) {
    return api.post<ApiResponse<MoodLog>>(MOOD_BASE_URL, payload);
  },
  /** WARNING: passing page/limit currently crashes the backend
   * (uncoerced string → Prisma `take` validation error). Omit them
   * until the backend parses with Number(). */
  list(params: { page?: number; limit?: number; startDate?: string; endDate?: string }) {
    return api.get<ApiResponse<MoodListResponse>>(MOOD_BASE_URL, { params });
  },
  getById(id: string) {
    return api.get<ApiResponse<MoodLog>>(`${MOOD_BASE_URL}/${id}`);
  },
  /** WARNING: same uncoerced page/limit crash as list() — omit until fixed. */
  getPartner(params: { page?: number; limit?: number }) {
    return api.get<ApiResponse<MoodListResponse>>(`${MOOD_BASE_URL}/partner`, { params });
  },
  getToday(startDate: string, endDate: string) {
    /* Deliberately NO page/limit: the backend forwards query params to
     * Prisma uncoerced (it would send take: "1" — a string — and Prisma
     * rejects it; its numeric defaults only apply when the params are
     * absent). The unique (userId, logDate) index means a single-day
     * range returns at most one row, so the default page of 20 is ample.
     * Remove this note once the backend parses page/limit with Number(). */
    return api.get<ApiResponse<MoodListResponse>>(MOOD_BASE_URL, {
      params: { startDate, endDate },
    });
  },
  remove(id: string) {
    return api.delete<ApiResponse<MoodLog>>(`${MOOD_BASE_URL}/${id}`);
  },
};
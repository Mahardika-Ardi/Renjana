import { api } from './client';
import type {
  ApiResponse,
  EmotionDump,
  EmotionDumpStatus,
  PartnerEmotionDump,
} from '@renjana/types';
import { EMOTION_DUMP_BASE_URL } from '../constants/url';

/* Emotion Dump endpoints (backend emotion-dump module).
 *
 * Response shapes verified against ResponseInterceptor:
 * - POST/PATCH return {message, data} → data is the dump itself.
 * - GET / and GET /partner return {items, ...} WITHOUT a `data` key, so the
 *   interceptor wraps the whole object → items live at res.data.items
 *   (the partner's meta survives the same way).
 * - list() takes weekNumber/weekYear/status filters — all Number()-coerced
 *   by the backend; we fetch everything and group client-side.
 * - Lifecycle: PRIVATE → (weekly Sunday cron) → REFINED → SHARED (terminal)
 *   or REFINED → PRIVATE (back to pending). Invalid transitions → 400.
 * - Throttles: 30/min create & patch, 60/min reads. rawContent has NO
 *   backend maxLength — the UI caps it client-side.
 */
export const emotionDumpApi = {
  /** POST /emotion-dumps — new PRIVATE dump for the current ISO week. */
  create(rawContent: string) {
    return api.post<ApiResponse<EmotionDump>>(EMOTION_DUMP_BASE_URL, {
      rawContent,
    });
  },

  /** GET /emotion-dumps — own dumps, newest first (no params → full history). */
  list() {
    return api.get<ApiResponse<{ items: EmotionDump[] }>>(EMOTION_DUMP_BASE_URL);
  },

  /** GET /emotion-dumps/partner — partner's SHARED dumps (page/limit are Number()'d). */
  partner(page = 1, limit = 20) {
    return api.get<
      ApiResponse<{
        items: PartnerEmotionDump[];
        meta?: { page: number; limit: number; total: number; totalPages: number };
        message?: string;
      }>
    >(`${EMOTION_DUMP_BASE_URL}/partner`, { params: { page, limit } });
  },

  /** PATCH /emotion-dumps/:id — status transition, only REFINED → SHARED|PRIVATE. */
  updateStatus(id: string, status: Extract<EmotionDumpStatus, 'SHARED' | 'PRIVATE'>) {
    return api.patch<ApiResponse<EmotionDump>>(
      `${EMOTION_DUMP_BASE_URL}/${id}`,
      { status },
    );
  },
};

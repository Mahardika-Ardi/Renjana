import { api } from './client';
import type {
  ApiResponse,
  ConsultationExchange,
  ConsultationSessionDetail,
  ConsultationSessionSummary,
} from '@renjana/types';
import { CONSULTATION_BASE_URL } from '../constants/url';

/* Relationship AI Counselor endpoints (backend consultation module).
 *
 * Notes verified against the backend:
 * - GET /consultations pagination is string-safe (controller parseInts).
 *   The global ResponseInterceptor keeps only {message, data} from a
 *   controller reply, so the list's `meta` is DROPPED on the wire — the
 *   list arrives as a bare array. We request limit=50 and treat it as the
 *   complete history (chat histories are short; no pager).
 * - AI replies are synchronous: create/send resolve only after the model
 *   (or local fallback) answered, so callers must show a waiting state.
 * - Every message is capped at 2000 chars; rate limit 20/min.
 */
export const consultationApi = {
  /** POST /consultations — new session + first message; response already contains both bubbles. */
  create(firstMessage: string, title?: string) {
    return api.post<ApiResponse<ConsultationSessionDetail>>(
      CONSULTATION_BASE_URL,
      title ? { firstMessage, title } : { firstMessage },
    );
  },

  /** GET /consultations — session history (newest first), up to `limit`. */
  list(limit = 50) {
    return api.get<ApiResponse<ConsultationSessionSummary[]>>(
      CONSULTATION_BASE_URL,
      { params: { page: 1, limit } },
    );
  },

  /** GET /consultations/:id — full conversation, messages ascending. */
  detail(id: string) {
    return api.get<ApiResponse<ConsultationSessionDetail>>(
      `${CONSULTATION_BASE_URL}/${id}`,
    );
  },

  /** POST /consultations/:id/messages — returns {userMessage, assistantMessage}. */
  sendMessage(id: string, content: string) {
    return api.post<ApiResponse<ConsultationExchange>>(
      `${CONSULTATION_BASE_URL}/${id}/messages`,
      { content },
    );
  },

  /** DELETE /consultations/:id — cascade-deletes the conversation. */
  remove(id: string) {
    return api.delete<ApiResponse<{ message: string }>>(
      `${CONSULTATION_BASE_URL}/${id}`,
    );
  },
};

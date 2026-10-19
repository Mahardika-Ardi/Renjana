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
  list(params: { page?: number; limit?: number; startDate?: string; endDate?: string }) {
    return api.get<ApiResponse<MoodListResponse>>(MOOD_BASE_URL, { params });
  },
  getById(id: string) {
    return api.get<ApiResponse<MoodLog>>(`${MOOD_BASE_URL}/${id}`);
  },
  getPartner(params: { page?: number; limit?: number }) {
    return api.get<ApiResponse<MoodListResponse>>(`${MOOD_BASE_URL}/partner`, { params });
  },
  getToday(startDate: string, endDate: string) {
    return api.get<ApiResponse<MoodListResponse>>(MOOD_BASE_URL, {
      params: { page: 1, limit: 1, startDate, endDate },
    });
  },
  remove(id: string) {
    return api.delete<ApiResponse<MoodLog>>(`${MOOD_BASE_URL}/${id}`);
  },
};
import { api } from './client';
import { STREAK_BASE_URL } from '../constants/url';

import type {
  ApiResponse,
  NudgeActionResult,
  StreakResponse,
} from '@renjana/types';

export const streakApi = {
  get() {
    return api.get<ApiResponse<StreakResponse>>(`${STREAK_BASE_URL}`);
  },

  nudge() {
    return api.post<ApiResponse<NudgeActionResult>>(
      `${STREAK_BASE_URL}/nudge`,
    );
  },

  reply() {
    return api.post<ApiResponse<NudgeActionResult>>(
      `${STREAK_BASE_URL}/nudge/reply`,
    );
  },
};

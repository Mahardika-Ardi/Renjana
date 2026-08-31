import { api } from './client';

import type {
  ApiResponse,
  AuthResponse,
  LoginDto,
  RegisterDto,
} from '@renjana/types';
import { AUTH_BASE_URL } from './config';

export const authApi = {
  login(dto: LoginDto) {
    return api.post<ApiResponse<AuthResponse>>(`${AUTH_BASE_URL}/login`, dto);
  },

  register(dto: RegisterDto) {
    return api.post<ApiResponse<AuthResponse>>(
      `${AUTH_BASE_URL}/register`,
      dto,
    );
  },

  forgotPassword(email: string) {
    return api.post<ApiResponse<string>>(
      `${AUTH_BASE_URL}/forgot-password`,
      email,
    );
  },
};

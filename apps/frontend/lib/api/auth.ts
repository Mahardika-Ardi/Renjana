import { api } from './client';

import type {
  ApiResponse,
  AuthResponse,
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordFinalDto,
  VerifyResetCodeDto,
  VerifyResetCodeResponse,
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

  reqCodeResetPassword(dto: ForgotPasswordDto) {
    return api.post<ApiResponse<{ message: string }>>(
      `${AUTH_BASE_URL}/request-reset-code`,
      dto,
    );
  },

  verifyPasswordResetCode(dto: VerifyResetCodeDto) {
    return api.post<ApiResponse<VerifyResetCodeResponse>>(
      `${AUTH_BASE_URL}/verify-reset-code`,
      dto,
    );
  },

  resetPassword(dto: ResetPasswordFinalDto) {
    return api.post<ApiResponse<{ message: string }>>(
      `${AUTH_BASE_URL}/reset-password-final`,
      dto,
    );
  },
};

import { api } from './client';

import type {
  AcceptInviteDto,
  ApiResponse,
  AuthResponse,
  AuthUser,
  ForgotPasswordDto,
  InviteResponse,
  LoginDto,
  RegisterDto,
  ResetPasswordFinalDto,
  ValidateInviteResponse,
  VerifyResetCodeDto,
  VerifyResetCodeResponse,
} from '@renjana/types';
import { AUTH_BASE_URL } from '../constants/url';

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

  getUserProfile() {
    return api.get<ApiResponse<AuthUser>>(`${AUTH_BASE_URL}/me`);
  },

  invite() {
    return api.post<ApiResponse<InviteResponse>>(`${AUTH_BASE_URL}/invite`);
  },

  validateInvite(token: string) {
    return api.get<ApiResponse<ValidateInviteResponse>>(
      `${AUTH_BASE_URL}/invite/validate?token=${encodeURIComponent(token)}`,
    );
  },

  acceptInvite(dto: AcceptInviteDto) {
    return api.post<ApiResponse<AuthUser>>(
      `${AUTH_BASE_URL}/invite/accept`,
      dto,
    );
  },
};

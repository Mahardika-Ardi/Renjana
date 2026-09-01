// ================================================================
// @renjana/types — Auth Types
// Shared between frontend & backend
// ================================================================

// ---- JWT Payload -----------------------------------------------
export interface JwtPayload {
  sub: string; // user id
  email: string;
  iat?: number;
  exp?: number;
}

export interface JwtRefreshPayload extends JwtPayload {
  refreshToken: string;
}

// ---- Auth Responses --------------------------------------------
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  isEmailVerified: boolean;
  coupleId: string | null;
  partnerId: string | null;
}

export interface AuthResponse {
  user: AuthUser;
  tokens: AuthTokens;
}

// ---- API Response Wrapper --------------------------------------
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

// ---- Couple Types ----------------------------------------------
export interface CoupleInfo {
  id: string;
  partnerId: string;
  partnerName: string;
  partnerAvatarUrl: string | null;
  relationshipStatus: string;
  togetherSince: string | null;
  currentStreak: number;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  name: string;
  email: string;
  password: string;
  inviteToken?: string;
}

// ---- Password Reset Types ---------------------------------------
export interface RequestResetCodeDto {
  email: string;
}

export interface ForgotPasswordDto {
  email: string;
}

export interface VerifyResetCodeDto {
  email: string;
  code: string;
}

export interface VerifyResetCodeResponse {
  resetToken: string;
  expiresIn: number;
}

export interface ResetPasswordFinalDto {
  email: string;
  resetToken: string;
  newPassword: string;
}

export interface ResetPasswordDto {
  token: string;
  newPassword: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  iat?: number;
  exp?: number;
}
export interface JwtRefreshPayload extends JwtPayload {
  refreshToken: string;
}
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
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
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

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
}

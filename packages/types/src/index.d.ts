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
export interface LoginResponse {
    user: AuthUser;
    tokens: AuthTokens;
}
export interface RegisterResponse {
    user: AuthUser;
    tokens: AuthTokens;
}
export interface ApiResponse<T = unknown> {
    success: boolean;
    message: string;
    data?: T;
    error?: string;
    statusCode: number;
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

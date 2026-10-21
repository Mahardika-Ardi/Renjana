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
// ---- Auth Type --------------------------------------------
export type AuthTypes =
  'Sign In' | 'Sign Up' | 'Forgot Password' | 'Reset Password';

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

/** Couple summary embedded in GET /auth/me (AuthService.getMe). */
export interface MeCoupleInfo {
  id: string;
  partnerId: string | null;
  partnerName: string | null;
  partnerAvatarUrl: string | null;
  currentStreak: number;
}

// ---- DTO -------------------------------------------------------
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

export interface ResetPasswordFinalDto {
  email: string;
  resetToken: string;
  newPassword: string;
}

export interface ResetPasswordDto {
  token: string;
  newPassword: string;
}

export interface AcceptInviteDto {
  token: string;
  email?: string;
  password?: string;
}

export interface CreateJournalDto {
  content: string;
  tags: string[];
  /** YYYY-MM-DD */
  entryDate: string;
  isShared: boolean;
}

export type UpdateJournalDto = Partial<CreateJournalDto>;

// ---- API Response Wrapper --------------------------------------
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

// ---- Response ------------------------------------------------

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
  couple: MeCoupleInfo | null;
}

export interface AuthResponse {
  user: AuthUser;
  tokens: AuthTokens;
}
export interface VerifyResetCodeResponse {
  resetToken: string;
  expiresIn: number;
}

export interface JournalResponse {
  id: string;
  userId: string;
  content: string;
  tags: string[];
  entryDate: string;
  isShared: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ObjectJournalResponse {
  items: JournalResponse[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ---- Partner shared journal feed (GET /journal/partner) ---------------

export interface PartnerJournalUser {
  id: string;
  name: string;
  avatarUrl: string | null;
}

/** One partner-owned entry the couple can both read (isShared: true). */
export interface PartnerJournalEntry {
  id: string;
  content: string;
  tags: string[];
  entryDate: string;
  createdAt: string;
  user: PartnerJournalUser;
}

export interface ObjectPartnerJournalResponse {
  items: PartnerJournalEntry[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  /** Present only when the caller has no active couple. */
  message?: string;
}

export interface DeletedResponse {
  message: string;
}

export interface InviteResponse {
  inviteUrl: string;
  token: string;
  code: string;
  expiresAt: Date;
}

export interface InviteSender {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
}

export interface ValidateInviteResponse {
  valid: boolean;
  sender: InviteSender;
  expiresAt: string;
}

// ---- Todo ------------------------------------------------------
export type TodoCategory =
  | 'HOME'
  | 'ERRANDS'
  | 'SOCIAL'
  | 'PLANS'
  | 'FINANCES'
  | 'OTHER';

export type TodoStatus = 'PENDING' | 'COMPLETED';

export interface CreateTodoDto {
  title: string;
  description?: string;
  category?: TodoCategory;
  /** YYYY-MM-DD */
  dueDate?: string;
}

export type UpdateTodoDto = Partial<CreateTodoDto>;

export interface TodoCreator {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export interface TodoResponse {
  id: string;
  coupleId: string;
  creatorId: string;
  title: string;
  description: string | null;
  category: TodoCategory;
  status: TodoStatus;
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  creator: TodoCreator;
}

export interface TodoListResponse {
  items: TodoResponse[];
}

// ---- Query and Params ----------------------------------------------
export interface JournalQueryParams {
  page?: string;
  limit?: string;
  startDate?: string;
  endDate?: string;
}

// ---- Streak & Nudge Types ----------------------------------------
export type NudgeStatus = 'PENDING' | 'REPLIED';

export type TodayNudgeState =
  | 'IDLE'
  | 'WAITING_PARTNER'
  | 'WAITING_YOU'
  | 'COMPLETED';

export interface TodayNudgeInfo {
  status: TodayNudgeState;
  nudgeId?: string;
  senderId?: string;
  receiverId?: string;
  repliedAt?: string | null;
}

export interface StreakCouplePartner {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export interface StreakResponse {
  currentStreak: number;
  longestStreak: number;
  lastEngagedAt: string | null;
  couple: {
    id: string;
    user1: StreakCouplePartner;
    user2: StreakCouplePartner;
  };
  todayNudge: TodayNudgeInfo;
  recentLogs: Array<{ userId: string; engagedDate: string }>;
}

export interface NudgeActionResult {
  message: string;
  status: TodayNudgeState;
  currentStreak?: number;
  longestStreak?: number;
}

// ---- Consultation (Relationship AI Counselor) -----------------------

export type ConsultationSender = 'USER' | 'ASSISTANT';

export interface ConsultationMessage {
  id: string;
  sessionId: string;
  sender: ConsultationSender;
  content: string;
  createdAt: string;
}

/** Row shape of GET /consultations (list items include only the newest message). */
export interface ConsultationSessionSummary {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  totalMessages: number;
  lastMessage: ConsultationMessage | null;
}

export interface ConsultationSessionDetail {
  id: string;
  title: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  messages: ConsultationMessage[];
}

/** Response pair of POST /consultations/:id/messages. */
export interface ConsultationExchange {
  userMessage: ConsultationMessage;
  assistantMessage: ConsultationMessage;
}

// ---- Emotion Dump (Daily Layer) -------------------------------------

/** PRIVATE → (weekly AI cron) → REFINED → SHARED | PRIVATE (user). SHARED is terminal. */
export type EmotionDumpStatus = 'PRIVATE' | 'REFINED' | 'SHARED';

export interface EmotionDump {
  id: string;
  userId: string;
  rawContent: string;
  refinedContent: string | null;
  aiProcessedAt: string | null;
  status: EmotionDumpStatus;
  sharedAt: string | null;
  weekNumber: number;
  weekYear: number;
  createdAt: string;
  updatedAt: string;
}

/** Row shape of GET /emotion-dumps/partner (SHARED dumps of the partner). */
export interface PartnerEmotionDump {
  id: string;
  refinedContent: string | null;
  sharedAt: string | null;
  weekNumber: number;
  weekYear: number;
  user: { id: string; name: string; avatarUrl: string | null };
}

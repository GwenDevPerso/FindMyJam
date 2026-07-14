export type AppErrorCode =
  | 'UNAUTHORIZED'
  | 'INVALID_CREDENTIALS'
  | 'EMAIL_ALREADY_REGISTERED'
  | 'WEAK_PASSWORD'
  | 'VALIDATION_ERROR'
  | 'NETWORK_ERROR'
  | 'JAM_NOT_FOUND'
  | 'JAM_FULL'
  | 'ALREADY_JOINED'
  | 'NOT_CREATOR'
  | 'NOT_PARTICIPANT'
  | 'CREATOR_CANNOT_JOIN'
  | 'LOCATION_DENIED'
  | 'PROFILE_NOT_FOUND'
  | 'INVALID_AVATAR'
  | 'FRIENDSHIP_NOT_FOUND'
  | 'FRIEND_REQUEST_EXISTS'
  | 'ALREADY_FRIENDS'
  | 'CANNOT_FRIEND_SELF'
  | 'FRIENDSHIP_BLOCKED'
  | 'FRIENDSHIP_NOT_PENDING'
  | 'NOT_FRIENDSHIP_ADDRESSEE'
  | 'NOT_FRIENDSHIP_INVOLVED'
  | 'UNKNOWN';

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly statusCode: number | null;

  constructor(code: AppErrorCode, message: string, statusCode: number | null) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

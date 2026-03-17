export type ApiSuccess<T = unknown> = {
  success: true;
  data: T;
  message?: string;
  meta?: { page?: number; limit?: number; total?: number };
};

export type ApiError = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
};

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;

export interface JwtPayload {
  sub: string;
  email: string;
  roleId: number;
  roleName: string;
  employeeId: string;
  type: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}

export type ScopePermissionFlags = {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
};

export interface RequestUser {
  userId: string;
  email: string;
  roleId: number;
  roleName: string;
  employeeId: string;
  /** Set by middleware for hr_admin: scopeId -> flags. Super Admin has full access and may have undefined. */
  scopePermissions?: Record<string, ScopePermissionFlags>;
}

declare global {
  namespace Express {
    interface Request {
      user?: RequestUser;
    }
  }
}

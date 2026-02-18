export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: { code: string; message: string; details?: Record<string, unknown> };
  meta?: { page?: number; limit?: number; total?: number };
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    email: string;
    roleName: string;
    employeeId: string;
  };
}

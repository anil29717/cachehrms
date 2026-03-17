import { api } from './client';

export type ExpenseTypeDto = {
  id: number;
  category: string;
  name: string;
  limitAmount: number;
  limitUnit: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ExpenseClaimItemDto = {
  id: string;
  claimId: string;
  expenseTypeId: number;
  expenseTypeName?: string;
  expenseTypeCategory?: string;
  amount: number;
  quantity: number | null;
  description: string | null;
  expenseDate: string;
  createdAt: string;
};

export type ExpenseClaimDto = {
  id: string;
  employeeId: string;
  employeeName?: string;
  totalAmount: number;
  status: string;
  managerApprovedAt: string | null;
  managerApprovedBy: string | null;
  financeApprovedAt: string | null;
  financeApprovedBy: string | null;
  hrApprovedAt: string | null;
  hrApprovedBy: string | null;
  rejectedAt: string | null;
  rejectedBy: string | null;
  rejectReason: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  items: ExpenseClaimItemDto[];
};

export type ExpenseReportSummary = {
  countByStatus: Record<string, number>;
  sumByStatus: Record<string, number>;
  totalApprovedAmount: number;
};

async function getData<T>(res: unknown): Promise<T> {
  const r = res as { data?: T };
  return r.data as T;
}

export const expenseTypesApi = {
  list: (params?: { category?: string; isActive?: string }) =>
    api.get<{ data: ExpenseTypeDto[] }>('/expense-types', params as Record<string, string>).then(getData),

  getById: (id: number) =>
    api.get<{ data: ExpenseTypeDto }>(`/expense-types/${id}`).then(getData),

  create: (body: {
    category: string;
    name: string;
    limitAmount: number;
    limitUnit?: string | null;
  }) =>
    api.post<{ data: ExpenseTypeDto }>('/expense-types', body).then(getData),

  update: (
    id: number,
    body: {
      category?: string;
      name?: string;
      limitAmount?: number;
      limitUnit?: string | null;
      isActive?: boolean;
    }
  ) =>
    api.put<{ data: ExpenseTypeDto }>(`/expense-types/${id}`, body).then(getData),
};

export const expenseClaimsApi = {
  list: (params?: {
    status?: string;
    employeeId?: string;
    limit?: string;
    offset?: string;
  }) =>
    api
      .get<{ data: ExpenseClaimDto[]; meta?: { total: number } }>(
        '/expense-claims',
        params as Record<string, string>
      )
      .then((r) => {
        const res = r as { data: ExpenseClaimDto[]; meta?: { total: number } };
        return { items: res.data ?? [], total: res.meta?.total ?? 0 };
      }),

  getById: (id: string) =>
    api.get<{ data: ExpenseClaimDto }>(`/expense-claims/${id}`).then(getData),

  create: (body: {
    items: Array<{
      expenseTypeId: number;
      amount: number;
      quantity?: number | null;
      description?: string | null;
      expenseDate: string;
    }>;
  }) =>
    api.post<{ data: ExpenseClaimDto }>('/expense-claims', body).then(getData),

  approveManager: (id: string) =>
    api.post<{ data: ExpenseClaimDto }>(`/expense-claims/${id}/approve-manager`).then(getData),

  approveFinance: (id: string) =>
    api.post<{ data: ExpenseClaimDto }>(`/expense-claims/${id}/approve-finance`).then(getData),

  approveHr: (id: string) =>
    api.post<{ data: ExpenseClaimDto }>(`/expense-claims/${id}/approve-hr`).then(getData),

  markPaid: (id: string) =>
    api.post<{ data: ExpenseClaimDto }>(`/expense-claims/${id}/paid`).then(getData),

  reject: (id: string, reason?: string) =>
    api.post<{ data: ExpenseClaimDto }>(`/expense-claims/${id}/reject`, { reason }).then(getData),

  report: () =>
    api.get<{ data: ExpenseReportSummary }>('/expense-claims/report').then(getData),
};

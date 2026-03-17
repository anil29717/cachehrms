import { api } from './client';

export type AnnouncementDto = {
  id: string;
  type: string;
  title: string;
  body: string;
  eventDate: string | null;
  createdBy: string;
  creatorName?: string;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
  readCount?: number;
};

async function getData<T>(res: unknown): Promise<T> {
  const r = res as { data?: T };
  return r.data as T;
}

export const announcementsApi = {
  list: (params?: { type?: string; sentOnly?: string; limit?: string; offset?: string }) =>
    api
      .get<{ data: AnnouncementDto[]; meta?: { total: number } }>(
        '/announcements',
        params as Record<string, string>
      )
      .then((r) => {
        const res = r as { data: AnnouncementDto[]; meta?: { total: number } };
        return { items: res.data ?? [], total: res.meta?.total ?? 0 };
      }),

  getById: (id: string) =>
    api.get<{ data: AnnouncementDto }>(`/announcements/${id}`).then(getData),

  create: (body: { type: string; title: string; body: string; eventDate?: string | null }) =>
    api.post<{ data: AnnouncementDto }>('/announcements', body).then(getData),

  update: (
    id: string,
    body: { type?: string; title?: string; body?: string; eventDate?: string | null }
  ) =>
    api.put<{ data: AnnouncementDto }>(`/announcements/${id}`, body).then(getData),

  delete: (id: string) =>
    api.delete<{ data: { deleted: boolean } }>(`/announcements/${id}`).then(getData),

  publish: (id: string) =>
    api.post<{ data: AnnouncementDto }>(`/announcements/${id}/publish`).then(getData),

  markRead: (id: string) =>
    api.post<{ data: { read: boolean } }>(`/announcements/${id}/read`).then(getData),

  getBirthdays: (filter: 'today' | 'week' | 'month') =>
    api
      .get<{ data: Array<{ employeeCode: string; firstName: string; lastName: string; dateOfBirth: string }> }>(
        '/announcements/birthdays',
        { filter }
      )
      .then(getData),

  getNationalHolidays: (params?: { year?: string; limit?: string }) =>
    api
      .get<{ data: Array<{ id: number; name: string; holidayDate: string; year: number | null; isOptional: boolean }> }>(
        '/announcements/national-holidays',
        params as Record<string, string>
      )
      .then(getData),

  getUpcomingHolidays: (limit?: number) =>
    api
      .get<{
        data: Array<{ id: string; title: string; body: string; eventDate: string | null; createdAt: string }>;
      }>('/announcements/holidays/upcoming', limit != null ? { limit: String(limit) } : undefined)
      .then(getData),

  getAssetReminders: (overdueOnly?: boolean) =>
    api
      .get<{
        data: Array<{
          id: string;
          assetName: string;
          serialNumber: string | null;
          employeeCode: string;
          employeeName: string;
          assignedAt: string;
          daysOut: number;
          overdue: boolean;
        }>;
      }>(
        '/announcements/asset-reminders',
        overdueOnly ? { overdueOnly: 'true' } : undefined
      )
      .then(getData),

  getReport: (limit?: number) =>
    api
      .get<{
        data: Array<{
          id: string;
          type: string;
          title: string;
          sentAt: string;
          creatorName: string;
          readCount: number;
        }>;
      }>('/announcements/report', limit != null ? { limit: String(limit) } : undefined)
      .then(getData),
};

export const ANNOUNCEMENT_TYPES = [
  { value: 'birthday', label: 'Birthday' },
  { value: 'holiday', label: 'Holiday' },
  { value: 'asset', label: 'Asset Collection' },
  { value: 'event', label: 'Event' },
  { value: 'deadline', label: 'Deadline' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'policy', label: 'Policy' },
] as const;

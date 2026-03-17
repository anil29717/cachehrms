import { prisma } from '../config/database.js';

const KEY_EMPLOYEE_FULL_API_FIELDS = 'employee_full_api_fields';
const KEY_SUBADMIN_TITLES = 'subadmin_titles';

export type EmployeeFullApiFieldsValue = string[] | null;

export class SystemSettingService {
  /** Get admin-configured list of field names for employee full API. Returns null if not set (meaning return all fields). */
  async getEmployeeFullApiFields(): Promise<EmployeeFullApiFieldsValue> {
    const row = await prisma.systemSetting.findUnique({
      where: { key: KEY_EMPLOYEE_FULL_API_FIELDS },
      select: { value: true },
    });
    if (!row?.value || !Array.isArray(row.value)) return null;
    const arr = row.value as unknown[];
    if (arr.length === 0) return null;
    return arr.filter((v): v is string => typeof v === 'string');
  }

  /** Set admin-configured field names for employee full API. Pass null or empty array to mean "all fields". */
  async setEmployeeFullApiFields(fields: string[] | null): Promise<string[] | null> {
    const value = fields?.length ? fields : null;
    await prisma.systemSetting.upsert({
      where: { key: KEY_EMPLOYEE_FULL_API_FIELDS },
      create: { key: KEY_EMPLOYEE_FULL_API_FIELDS, value: value as object },
      update: { value: value as object },
    });
    return value ?? null;
  }

  async getSubadminTitles(): Promise<string[]> {
    const row = await prisma.systemSetting.findUnique({
      where: { key: KEY_SUBADMIN_TITLES },
      select: { value: true },
    });
    if (!row?.value || !Array.isArray(row.value)) return [];
    return (row.value as unknown[]).filter((v): v is string => typeof v === 'string' && v.trim().length > 0);
  }

  async setSubadminTitles(titles: string[]): Promise<string[]> {
    const value = titles
      .map((t) => t.trim())
      .filter(Boolean);
    await prisma.systemSetting.upsert({
      where: { key: KEY_SUBADMIN_TITLES },
      create: { key: KEY_SUBADMIN_TITLES, value: value as object },
      update: { value: value as object },
    });
    return value;
  }
}

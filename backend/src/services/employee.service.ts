import { prisma } from '../config/database.js';
import type { Prisma } from '@prisma/client';
import { errors } from '../utils/errors.js';

const EMPLOYMENT_TYPES = ['full_time', 'contract', 'intern', 'part_time'] as const;
const STATUSES = ['active', 'inactive', 'terminated', 'on_leave'] as const;
const EXTERNAL_ROLES = ['employee', 'manager', 'admin', 'subadmin'] as const;

export type CreateEmployeeInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  departmentId?: number;
  designation?: string;
  reportingTo?: string;
  externalRole?: string;
  externalSubRole?: string;
  dateOfJoining?: string;
  employmentType: string;
  workLocation?: string;
};

export type ListEmployeesQuery = {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  departmentId?: string;
  employmentType?: string;
};

export class EmployeeService {
  /** Generate next employee code: EMP-YYYY-XXXX (e.g. EMP-2026-0001) */
  async generateEmployeeCode(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `EMP-${year}-`;
    const last = await prisma.employee.findFirst({
      where: { employeeCode: { startsWith: prefix } },
      orderBy: { employeeCode: 'desc' },
      select: { employeeCode: true },
    });
    const nextNum = last
      ? parseInt(last.employeeCode.slice(prefix.length), 10) + 1
      : 1;
    return `${prefix}${String(nextNum).padStart(4, '0')}`;
  }

  /**
   * Generate employee code with department: EMP-YYYY-DEPT-NNN (e.g. EMP-2026-IT-001).
   * Sequence is per department per calendar year.
   */
  async generateEmployeeCodeForDepartment(departmentId: number): Promise<string> {
    const department = await prisma.department.findUnique({
      where: { id: departmentId },
      select: { code: true, name: true },
    });
    if (!department) throw errors.notFound('Department');
    const deptCode = (department.code ?? department.name.slice(0, 3)).trim().toUpperCase().slice(0, 6) || 'GEN';
    const year = new Date().getFullYear();
    const prefix = `EMP-${year}-${deptCode}-`;
    const last = await prisma.employee.findFirst({
      where: { employeeCode: { startsWith: prefix } },
      orderBy: { employeeCode: 'desc' },
      select: { employeeCode: true },
    });
    const nextNum = last
      ? parseInt(last.employeeCode.slice(prefix.length), 10) + 1
      : 1;
    return `${prefix}${String(nextNum).padStart(3, '0')}`;
  }

  /** Distinct designation values from employees (for dropdowns). */
  async getDistinctDesignations(): Promise<string[]> {
    const rows = await prisma.employee.findMany({
      where: { designation: { not: null } },
      select: { designation: true },
      distinct: ['designation'],
    });
    return rows.map((r) => r.designation!).filter(Boolean).sort();
  }

  /** Distinct work location values from employees (for dropdowns). */
  async getDistinctWorkLocations(): Promise<string[]> {
    const rows = await prisma.employee.findMany({
      where: { workLocation: { not: null } },
      select: { workLocation: true },
      distinct: ['workLocation'],
    });
    return rows.map((r) => r.workLocation!).filter(Boolean).sort();
  }

  async list(query: ListEmployeesQuery) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(500, Math.max(1, query.limit ?? 10));
    const skip = (page - 1) * limit;

    const where: Parameters<typeof prisma.employee.findMany>[0]['where'] = {};
    if (query.search?.trim()) {
      const term = `%${query.search.trim()}%`;
      where.OR = [
        { firstName: { contains: term, mode: 'insensitive' } },
        { lastName: { contains: term, mode: 'insensitive' } },
        { email: { contains: term, mode: 'insensitive' } },
        { employeeCode: { contains: term, mode: 'insensitive' } },
      ];
    }
    if (query.status?.trim()) where.status = query.status.trim();
    if (query.departmentId != null) where.departmentId = parseInt(query.departmentId, 10) || undefined;
    if (query.employmentType?.trim()) where.employmentType = query.employmentType.trim();

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }],
        skip,
        take: limit,
        include: {
          department: { select: { id: true, name: true } },
        },
      }),
      prisma.employee.count({ where }),
    ]);

    return {
      items: employees.map((e) => ({
        id: e.id,
        employeeCode: e.employeeCode,
        firstName: e.firstName,
        lastName: e.lastName,
        email: e.email,
        phone: e.phone,
        designation: e.designation,
        externalRole: (e as { externalRole?: string }).externalRole ?? 'employee',
        departmentId: e.departmentId,
        departmentName: e.department?.name ?? null,
        employmentType: e.employmentType,
        status: e.status,
        dateOfJoining: e.dateOfJoining,
        createdAt: e.createdAt,
      })),
      total,
      page,
      limit,
    };
  }

  async getById(id: string) {
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        department: { select: { id: true, name: true } },
        onboardings: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: {
            personalInfo: true,
            bankDetail: true,
            emergencyContacts: true,
            educations: true,
            experiences: true,
            documents: { select: { id: true, documentType: true, fileName: true, verificationStatus: true } },
          },
        },
      },
    });
    if (!employee) throw errors.notFound('Employee');
    const latestOnboarding = employee.onboardings?.[0] ?? null;
    const { onboardings: _ob, ...rest } = employee;
    return {
      ...rest,
      departmentName: employee.department?.name ?? null,
      onboarding: latestOnboarding
        ? {
            personalInfo: latestOnboarding.personalInfo,
            bankDetail: latestOnboarding.bankDetail,
            emergencyContacts: latestOnboarding.emergencyContacts ?? [],
            educations: latestOnboarding.educations ?? [],
            experiences: latestOnboarding.experiences ?? [],
            documents: latestOnboarding.documents ?? [],
          }
        : null,
    };
  }

  /** All allowed field names for ?fields= when requesting employee payload. */
  static readonly FULL_PAYLOAD_FIELDS = [
    'id', 'employeeCode', 'firstName', 'lastName', 'fullName', 'email', 'phone', 'dateOfBirth', 'gender',
    'departmentId', 'departmentName', 'departmentCode', 'designation', 'reportingTo', 'reportingManagerName',
    'externalRole',
    'externalSubRole',
    'dateOfJoining', 'employmentType', 'status', 'workLocation', 'profileImage', 'createdAt', 'updatedAt',
    'personalInfo', 'bankDetail', 'emergencyContacts', 'educations', 'experiences', 'documents',
    'defaultPassword',
  ] as const;

  /**
   * Returns a single payload with every employee-related field for sending/integration.
   * Pass options.fields (comma-separated) to return only selected keys.
   */
  async getFullPayload(id: string, options?: { fields?: string }) {
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        department: { select: { id: true, name: true, code: true } },
        onboardings: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: {
            personalInfo: true,
            bankDetail: true,
            emergencyContacts: true,
            educations: true,
            experiences: true,
            documents: { select: { id: true, documentType: true, fileName: true, verificationStatus: true } },
          },
        },
      },
    });
    if (!employee) throw errors.notFound('Employee');
    let reportingManagerName: string | null = null;
    if (employee.reportingTo) {
      const manager = await prisma.employee.findUnique({
        where: { employeeCode: employee.reportingTo },
        select: { firstName: true, lastName: true },
      });
      if (manager) reportingManagerName = `${manager.firstName} ${manager.lastName}`.trim();
    }
    const ob = employee.onboardings?.[0] ?? null;
    const result: Record<string, unknown> = {
      id: employee.id,
      employeeCode: employee.employeeCode,
      firstName: employee.firstName,
      lastName: employee.lastName,
      fullName: `${employee.firstName} ${employee.lastName}`.trim(),
      email: employee.email,
      phone: employee.phone,
      dateOfBirth: employee.dateOfBirth?.toISOString().slice(0, 10) ?? null,
      gender: employee.gender,
      departmentId: employee.departmentId,
      departmentName: employee.department?.name ?? null,
      departmentCode: employee.department?.code ?? null,
      designation: employee.designation,
      reportingTo: employee.reportingTo,
      reportingManagerName,
      externalRole: (employee as { externalRole?: string }).externalRole ?? 'employee',
      externalSubRole: (employee as { externalSubRole?: string | null }).externalSubRole ?? null,
      dateOfJoining: employee.dateOfJoining?.toISOString().slice(0, 10) ?? null,
      employmentType: employee.employmentType,
      status: employee.status,
      workLocation: employee.workLocation,
      profileImage: employee.profileImage,
      createdAt: employee.createdAt.toISOString(),
      updatedAt: employee.updatedAt.toISOString(),
      personalInfo: ob?.personalInfo ?? null,
      bankDetail: ob?.bankDetail ?? null,
      emergencyContacts: ob?.emergencyContacts ?? [],
      educations: ob?.educations ?? [],
      experiences: ob?.experiences ?? [],
      documents: ob?.documents ?? [],
    };
    const requestedList = options?.fields?.split(',').map((f) => f.trim()).filter(Boolean);
    const includeDefaultPassword = !requestedList?.length || requestedList.includes('defaultPassword');
    if (includeDefaultPassword) {
      const user = await prisma.user.findFirst({
        where: { employeeId: employee.employeeCode },
        select: { defaultPassword: true },
      });
      result.defaultPassword = user?.defaultPassword ?? null;
    }
    const allowed = new Set(EmployeeService.FULL_PAYLOAD_FIELDS);
    const requested = requestedList?.length ? requestedList : undefined;
    if (requested?.length) {
      const filtered: Record<string, unknown> = {};
      for (const key of requested) {
        if (allowed.has(key as (typeof EmployeeService.FULL_PAYLOAD_FIELDS)[number]) && key in result) {
          filtered[key] = result[key];
        }
      }
      return filtered;
    }
    return result;
  }

  async create(data: CreateEmployeeInput) {
    const email = data.email.trim().toLowerCase();
    const existing = await prisma.employee.findUnique({ where: { email } });
    if (existing) throw errors.conflict('Employee with this email already exists');

    if (!EMPLOYMENT_TYPES.includes(data.employmentType as (typeof EMPLOYMENT_TYPES)[number])) {
      throw errors.badRequest(
        `employmentType must be one of: ${EMPLOYMENT_TYPES.join(', ')}`
      );
    }

    if (data.externalRole !== undefined && !EXTERNAL_ROLES.includes(data.externalRole as (typeof EXTERNAL_ROLES)[number])) {
      throw errors.badRequest(`externalRole must be one of: ${EXTERNAL_ROLES.join(', ')}`);
    }

    if (data.departmentId != null) {
      const dept = await prisma.department.findUnique({ where: { id: data.departmentId } });
      if (!dept) throw errors.badRequest('Department not found');
    }

    const employeeCode = await this.generateEmployeeCode();
    const dateOfJoining = data.dateOfJoining
      ? new Date(data.dateOfJoining)
      : new Date();
    const dateOfBirth = data.dateOfBirth ? new Date(data.dateOfBirth) : null;

    const employee = await prisma.employee.create({
      data: {
        employeeCode,
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email,
        phone: data.phone?.trim() || null,
        dateOfBirth: dateOfBirth && !Number.isNaN(dateOfBirth.getTime()) ? dateOfBirth : null,
        gender: data.gender?.trim() || null,
        departmentId: data.departmentId ?? null,
        designation: data.designation?.trim() || null,
        reportingTo: data.reportingTo?.trim() || null,
        externalRole: (data.externalRole as (typeof EXTERNAL_ROLES)[number]) ?? 'employee',
        externalSubRole: data.externalSubRole?.trim() || null,
        dateOfJoining: dateOfJoining && !Number.isNaN(dateOfJoining.getTime()) ? dateOfJoining : null,
        employmentType: data.employmentType,
        status: 'active',
        workLocation: data.workLocation?.trim() || null,
      },
    });
    return employee;
  }

  /** Update core employee fields (PATCH /employees/:id). */
  async update(
    id: string,
    data: Partial<{
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      dateOfBirth: string;
      gender: string;
      departmentId: number;
      designation: string;
      reportingTo: string;
      externalRole: string;
      externalSubRole: string;
      dateOfJoining: string;
      employmentType: string;
      workLocation: string;
      status: string;
    }>
  ) {
    const existing = await prisma.employee.findUnique({ where: { id } });
    if (!existing) throw errors.notFound('Employee');
    if (data.email !== undefined) {
      const email = data.email.trim().toLowerCase();
      const other = await prisma.employee.findFirst({ where: { email, id: { not: id } } });
      if (other) throw errors.conflict('Another employee with this email exists');
      (data as Record<string, unknown>).email = email;
    }
    if (data.employmentType !== undefined && !EMPLOYMENT_TYPES.includes(data.employmentType as (typeof EMPLOYMENT_TYPES)[number])) {
      throw errors.badRequest(`employmentType must be one of: ${EMPLOYMENT_TYPES.join(', ')}`);
    }
    if (data.externalRole !== undefined && !EXTERNAL_ROLES.includes(data.externalRole as (typeof EXTERNAL_ROLES)[number])) {
      throw errors.badRequest(`externalRole must be one of: ${EXTERNAL_ROLES.join(', ')}`);
    }
    if (data.status !== undefined && !STATUSES.includes(data.status as (typeof STATUSES)[number])) {
      throw errors.badRequest(`status must be one of: ${STATUSES.join(', ')}`);
    }
    if (data.departmentId !== undefined && data.departmentId != null) {
      const dept = await prisma.department.findUnique({ where: { id: data.departmentId } });
      if (!dept) throw errors.badRequest('Department not found');
    }
    const dateOfBirth = data.dateOfBirth ? new Date(data.dateOfBirth) : undefined;
    const dateOfJoining = data.dateOfJoining ? new Date(data.dateOfJoining) : undefined;
    const payload: Prisma.EmployeeUpdateInput = {};
    if (data.firstName !== undefined) payload.firstName = data.firstName.trim();
    if (data.lastName !== undefined) payload.lastName = data.lastName.trim();
    if (data.email !== undefined) payload.email = data.email;
    if (data.phone !== undefined) payload.phone = data.phone?.trim() || null;
    if (data.dateOfBirth !== undefined) payload.dateOfBirth = dateOfBirth && !Number.isNaN(dateOfBirth.getTime()) ? dateOfBirth : null;
    if (data.gender !== undefined) payload.gender = data.gender?.trim() || null;
    if (data.departmentId !== undefined) {
      if (data.departmentId === null) {
        payload.department = { disconnect: true };
      } else {
        payload.department = { connect: { id: data.departmentId } };
      }
    }
    if (data.designation !== undefined) payload.designation = data.designation?.trim() || null;
    if (data.reportingTo !== undefined) payload.reportingTo = data.reportingTo?.trim() || null;
    if (data.externalRole !== undefined) payload.externalRole = (data.externalRole as (typeof EXTERNAL_ROLES)[number]) ?? 'employee';
    if (data.externalSubRole !== undefined) payload.externalSubRole = data.externalSubRole?.trim() || null;
    if (data.dateOfJoining !== undefined) payload.dateOfJoining = dateOfJoining && !Number.isNaN(dateOfJoining.getTime()) ? dateOfJoining : null;
    if (data.employmentType !== undefined) payload.employmentType = data.employmentType;
    if (data.workLocation !== undefined) payload.workLocation = data.workLocation?.trim() || null;
    if (data.status !== undefined) payload.status = data.status;
    const updated = await prisma.employee.update({
      where: { id },
      data: payload as Parameters<typeof prisma.employee.update>[0]['data'],
    });
    return updated;
  }

  /** Get or create an onboarding record linked to this employee for profile data (personal, bank, emergency, education, experience). */
  private async getOrCreateProfileOnboarding(employeeId: string) {
    const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee) throw errors.notFound('Employee');
    let ob = await prisma.onboarding.findFirst({
      where: { employeeId: employee.employeeCode },
      orderBy: { createdAt: 'desc' },
    });
    if (!ob) {
      ob = await prisma.onboarding.create({
        data: {
          candidateEmail: employee.email,
          employeeType: 'SWITCHING',
          currentStage: 10,
          status: 'HR_FILLED',
          employeeId: employee.employeeCode,
        },
      });
    }
    return ob;
  }

  /** Update profile (personal, bank, emergency contacts, educations, experiences) for an employee. */
  async updateProfile(
    employeeId: string,
    profile: {
      personalInfo?: Partial<{
        firstName: string;
        lastName: string;
        middleName: string;
        dateOfBirth: string;
        gender: string;
        maritalStatus: string;
        nationality: string;
        bloodGroup: string;
        personalEmail: string;
        personalMobile: string;
        alternateMobile: string;
        currentAddress: string;
        currentCity: string;
        currentState: string;
        currentPincode: string;
        currentCountry: string;
        permanentAddress: string;
        permanentCity: string;
        permanentState: string;
        permanentPincode: string;
        permanentCountry: string;
        panNumber: string;
        aadhaarNumber: string;
        passportNumber: string;
      }>;
      bankDetail?: Partial<{
        accountHolderName: string;
        bankName: string;
        branchName: string;
        accountNumber: string;
        ifscCode: string;
        accountType: string;
      }>;
      emergencyContacts?: Array<{
        contactName: string;
        relationship: string;
        phone: string;
        alternatePhone?: string;
        email?: string;
        address?: string;
        isPrimary?: boolean;
      }>;
      educations?: Array<{
        qualification: string;
        institution: string;
        universityBoard: string;
        yearOfPassing: number;
        percentageOrCgpa?: string;
        divisionOrClass?: string;
        specialization?: string;
        startDate?: string;
        endDate?: string;
      }>;
      experiences?: Array<{
        companyName: string;
        designation: string;
        employmentType: string;
        startDate: string;
        endDate: string;
        isCurrent: boolean;
        reasonForLeaving?: string;
        lastDrawnSalary?: string;
        reportingManagerName?: string;
      }>;
    }
  ) {
    const ob = await this.getOrCreateProfileOnboarding(employeeId);
    const obId = ob.id;

    if (profile.personalInfo !== undefined) {
      const p = profile.personalInfo;
      const dobRaw = p.dateOfBirth ? new Date(p.dateOfBirth) : new Date(0);
      const dateOfBirth = !Number.isNaN(dobRaw.getTime()) ? dobRaw : new Date(0);
      await prisma.onboardingPersonalInfo.upsert({
        where: { onboardingId: obId },
        create: {
          onboardingId: obId,
          firstName: (p.firstName ?? '').trim() || '—',
          lastName: (p.lastName ?? '').trim() || '—',
          middleName: p.middleName?.trim() || null,
          dateOfBirth,
          gender: (p.gender ?? '').trim() || '—',
          maritalStatus: p.maritalStatus?.trim() || null,
          nationality: (p.nationality ?? '').trim() || '—',
          bloodGroup: p.bloodGroup?.trim() || null,
          personalEmail: (p.personalEmail ?? '').trim() || '—',
          personalMobile: (p.personalMobile ?? '').trim() || '—',
          alternateMobile: p.alternateMobile?.trim() || null,
          currentAddress: (p.currentAddress ?? '').trim() || '—',
          currentCity: (p.currentCity ?? '').trim() || '—',
          currentState: (p.currentState ?? '').trim() || '—',
          currentPincode: (p.currentPincode ?? '').trim() || '—',
          currentCountry: (p.currentCountry ?? '').trim() || '—',
          permanentAddress: (p.permanentAddress ?? '').trim() || '—',
          permanentCity: (p.permanentCity ?? '').trim() || '—',
          permanentState: (p.permanentState ?? '').trim() || '—',
          permanentPincode: (p.permanentPincode ?? '').trim() || '—',
          permanentCountry: (p.permanentCountry ?? '').trim() || '—',
          panNumber: p.panNumber?.trim() || null,
          aadhaarNumber: p.aadhaarNumber?.trim() || null,
          passportNumber: p.passportNumber?.trim() || null,
        },
        update: {
          ...(p.firstName !== undefined && { firstName: p.firstName.trim() || '—' }),
          ...(p.lastName !== undefined && { lastName: p.lastName.trim() || '—' }),
          ...(p.middleName !== undefined && { middleName: p.middleName?.trim() || null }),
          ...(p.dateOfBirth !== undefined && { dateOfBirth: new Date(p.dateOfBirth) }),
          ...(p.gender !== undefined && { gender: p.gender.trim() || '—' }),
          ...(p.maritalStatus !== undefined && { maritalStatus: p.maritalStatus?.trim() || null }),
          ...(p.nationality !== undefined && { nationality: p.nationality.trim() || '—' }),
          ...(p.bloodGroup !== undefined && { bloodGroup: p.bloodGroup?.trim() || null }),
          ...(p.personalEmail !== undefined && { personalEmail: p.personalEmail.trim() || '—' }),
          ...(p.personalMobile !== undefined && { personalMobile: p.personalMobile.trim() || '—' }),
          ...(p.alternateMobile !== undefined && { alternateMobile: p.alternateMobile?.trim() || null }),
          ...(p.currentAddress !== undefined && { currentAddress: p.currentAddress.trim() || '—' }),
          ...(p.currentCity !== undefined && { currentCity: p.currentCity.trim() || '—' }),
          ...(p.currentState !== undefined && { currentState: p.currentState.trim() || '—' }),
          ...(p.currentPincode !== undefined && { currentPincode: p.currentPincode.trim() || '—' }),
          ...(p.currentCountry !== undefined && { currentCountry: p.currentCountry.trim() || '—' }),
          ...(p.permanentAddress !== undefined && { permanentAddress: p.permanentAddress.trim() || '—' }),
          ...(p.permanentCity !== undefined && { permanentCity: p.permanentCity.trim() || '—' }),
          ...(p.permanentState !== undefined && { permanentState: p.permanentState.trim() || '—' }),
          ...(p.permanentPincode !== undefined && { permanentPincode: p.permanentPincode.trim() || '—' }),
          ...(p.permanentCountry !== undefined && { permanentCountry: p.permanentCountry.trim() || '—' }),
          ...(p.panNumber !== undefined && { panNumber: p.panNumber?.trim() || null }),
          ...(p.aadhaarNumber !== undefined && { aadhaarNumber: p.aadhaarNumber?.trim() || null }),
          ...(p.passportNumber !== undefined && { passportNumber: p.passportNumber?.trim() || null }),
        },
      });
    }

    if (profile.bankDetail !== undefined) {
      const b = profile.bankDetail;
      await prisma.onboardingBankDetail.upsert({
        where: { onboardingId: obId },
        create: {
          onboardingId: obId,
          accountHolderName: (b.accountHolderName ?? '').trim() || '—',
          bankName: (b.bankName ?? '').trim() || '—',
          branchName: b.branchName?.trim() || null,
          accountNumber: (b.accountNumber ?? '').trim() || '—',
          ifscCode: (b.ifscCode ?? '').trim() || '—',
          accountType: (b.accountType ?? 'savings').trim(),
        },
        update: {
          ...(b.accountHolderName !== undefined && { accountHolderName: b.accountHolderName.trim() || '—' }),
          ...(b.bankName !== undefined && { bankName: b.bankName.trim() || '—' }),
          ...(b.branchName !== undefined && { branchName: b.branchName?.trim() || null }),
          ...(b.accountNumber !== undefined && { accountNumber: b.accountNumber.trim() || '—' }),
          ...(b.ifscCode !== undefined && { ifscCode: b.ifscCode.trim() || '—' }),
          ...(b.accountType !== undefined && { accountType: b.accountType.trim() || 'savings' }),
        },
      });
    }

    if (profile.emergencyContacts !== undefined) {
      await prisma.onboardingEmergencyContact.deleteMany({ where: { onboardingId: obId } });
      for (const ec of profile.emergencyContacts) {
        await prisma.onboardingEmergencyContact.create({
          data: {
            onboardingId: obId,
            contactName: (ec.contactName ?? '').trim() || '—',
            relationship: (ec.relationship ?? '').trim() || '—',
            phone: (ec.phone ?? '').trim() || '—',
            alternatePhone: ec.alternatePhone?.trim() || null,
            email: ec.email?.trim() || null,
            address: ec.address?.trim() || null,
            isPrimary: ec.isPrimary ?? false,
          },
        });
      }
    }

    if (profile.educations !== undefined) {
      await prisma.onboardingEducation.deleteMany({ where: { onboardingId: obId } });
      for (const ed of profile.educations) {
        await prisma.onboardingEducation.create({
          data: {
            onboardingId: obId,
            qualification: (ed.qualification ?? '').trim() || '—',
            institution: (ed.institution ?? '').trim() || '—',
            universityBoard: (ed.universityBoard ?? '').trim() || '—',
            yearOfPassing: ed.yearOfPassing ?? new Date().getFullYear(),
            percentageOrCgpa: ed.percentageOrCgpa?.trim() || null,
            divisionOrClass: ed.divisionOrClass?.trim() || null,
            specialization: ed.specialization?.trim() || null,
            startDate: ed.startDate ? new Date(ed.startDate) : null,
            endDate: ed.endDate ? new Date(ed.endDate) : null,
          },
        });
      }
    }

    if (profile.experiences !== undefined) {
      await prisma.onboardingExperience.deleteMany({ where: { onboardingId: obId } });
      for (const ex of profile.experiences) {
        await prisma.onboardingExperience.create({
          data: {
            onboardingId: obId,
            companyName: (ex.companyName ?? '').trim() || '—',
            designation: (ex.designation ?? '').trim() || '—',
            employmentType: (ex.employmentType ?? 'full_time').trim(),
            startDate: new Date(ex.startDate ?? 0),
            endDate: new Date(ex.endDate ?? 0),
            isCurrent: ex.isCurrent ?? false,
            reasonForLeaving: ex.reasonForLeaving?.trim() || null,
            lastDrawnSalary: ex.lastDrawnSalary?.trim() || null,
            reportingManagerName: ex.reportingManagerName?.trim() || null,
          },
        });
      }
    }

    return this.getById(employeeId);
  }
}

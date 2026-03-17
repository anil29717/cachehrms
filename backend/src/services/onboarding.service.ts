import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/database.js';
import {
  getOnboardingUploadDir,
  UPLOAD_DIR,
  ALLOWED_DOCUMENT_MIMES,
  MAX_DOCUMENT_SIZE_BYTES,
  MAX_PHOTO_SIZE_BYTES,
} from '../config/upload.js';
import { errors } from '../utils/errors.js';
import { EmployeeService } from './employee.service.js';

export const DOCUMENT_TYPES = {
  COMMON: ['photo', 'identity_proof', 'address_proof', 'pan_card', 'resume', 'signed_offer_letter', 'cancel_cheque', 'passport'] as const,
  FRESHER: ['class_10_marksheet', 'class_12_marksheet', 'marksheet', 'degree_certificate'] as const,
  SWITCHING: ['experience_letter', 'salary_slip'] as const,
} as const;

const EMPLOYEE_TYPES = ['FRESHER', 'SWITCHING'] as const;
const ONBOARDING_STATUSES = [
  'OFFER_ACCEPTED',
  'DOCUMENTS_PENDING',
  'DOCUMENT_REJECTED',
  'DOCUMENTS_VERIFIED',
  'IT_SETUP_PENDING',
  'IT_SETUP_COMPLETED',
  'HR_REVIEW_PENDING',
  'ACTIVE',
] as const;

const INVITE_TOKEN_EXPIRY_DAYS = 30;

export type CreateOnboardingInput = {
  candidateEmail: string;
  employeeType: (typeof EMPLOYEE_TYPES)[number];
  departmentId?: number;
  designation?: string;
};

export type ListOnboardingsQuery = {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
};

const PHONE_10_DIGITS = /^\d{10}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PAN_LENGTH = 10;
const AADHAAR_LENGTH = 12;
const PINCODE_LENGTH = 6;

export type PersonalInfoInput = {
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth: string; // YYYY-MM-DD
  gender: string;
  maritalStatus?: string;
  nationality: string;
  bloodGroup?: string;
  personalEmail: string;
  personalMobile: string;
  alternateMobile?: string;
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
  isSameAsCurrent?: boolean;
  panNumber?: string;
  aadhaarNumber?: string;
  passportNumber?: string;
  spouseName?: string;
  spouseDateOfBirth?: string;
  childrenNames?: string;
};

export type BankDetailInput = {
  accountHolderName: string;
  bankName: string;
  branchName?: string;
  accountNumber: string;
  ifscCode: string;
  accountType: string; // savings | current
};

export type EmergencyContactInput = {
  contactName: string;
  relationship: string;
  phone: string;
  alternatePhone?: string;
  email?: string;
  address?: string;
  isPrimary: boolean;
};

export type EducationInput = {
  qualification: string;
  institution: string;
  universityBoard: string;
  yearOfPassing: number;
  percentageOrCgpa?: string;
  divisionOrClass?: string;
  specialization?: string;
  startDate?: string;
  endDate?: string;
};

export type ExperienceInput = {
  companyName: string;
  designation: string;
  employmentType: string;
  startDate: string;
  endDate: string;
  isCurrent?: boolean;
  reasonForLeaving?: string;
  lastDrawnSalary?: string;
  reportingManagerName?: string;
};

export class OnboardingService {
  private generateInviteToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /** Stage 1: HR creates onboarding (offer acceptance); returns invite link for candidate */
  async create(input: CreateOnboardingInput) {
    const email = input.candidateEmail.trim().toLowerCase();
    if (!email) throw errors.badRequest('Candidate email is required');

    const type = input.employeeType?.toUpperCase();
    if (!EMPLOYEE_TYPES.includes(type as (typeof EMPLOYEE_TYPES)[number])) {
      throw errors.badRequest(`employeeType must be one of: ${EMPLOYEE_TYPES.join(', ')}`);
    }

    const existing = await prisma.onboarding.findFirst({
      where: {
        candidateEmail: email,
        status: { not: 'ACTIVE' },
      },
    });
    if (existing) throw errors.conflict('An active onboarding already exists for this email');

    if (input.departmentId != null) {
      const dept = await prisma.department.findUnique({ where: { id: input.departmentId } });
      if (!dept) throw errors.badRequest('Department not found');
    }

    const inviteToken = this.generateInviteToken();
    const inviteTokenExp = new Date();
    inviteTokenExp.setDate(inviteTokenExp.getDate() + INVITE_TOKEN_EXPIRY_DAYS);

    const onboarding = await prisma.onboarding.create({
      data: {
        candidateEmail: email,
        employeeType: type,
        currentStage: 1,
        status: 'OFFER_ACCEPTED',
        departmentId: input.departmentId ?? null,
        designation: input.designation?.trim() || null,
        inviteToken,
        inviteTokenExp,
      },
      include: {
        department: { select: { id: true, name: true, code: true } },
      },
    });

    const baseUrl = (process.env.FRONTEND_URL ?? 'http://localhost:3000').replace(/\/$/, '');
    const invitePath = `/onboarding/join/${onboarding.inviteToken}`;
    const inviteLink = `${baseUrl}${invitePath}`;
    const defaultPassword = process.env.ONBOARDING_DEFAULT_PASSWORD ?? 'ChangeMe@123';
    const companyName = process.env.COMPANY_NAME ?? 'Company';
    const companyDetails = process.env.COMPANY_DETAILS ?? '';

    return {
      ...onboarding,
      inviteLink: invitePath,
      inviteLinkFull: inviteLink,
      emailContent: {
        username: onboarding.candidateEmail,
        password: defaultPassword,
        onboardingLink: inviteLink,
        companyName,
        companyDetails,
      },
    };
  }

  /** Get onboarding by invite token (for candidate portal - no auth) */
  async getByInviteToken(token: string) {
    if (!token?.trim()) throw errors.badRequest('Invite token required');

    const onboarding = await prisma.onboarding.findUnique({
      where: { inviteToken: token.trim() },
      include: {
        department: { select: { id: true, name: true, code: true } },
        personalInfo: true,
        bankDetail: true,
        emergencyContacts: true,
        educations: true,
        experiences: true,
        documents: { select: { id: true, documentType: true, verificationStatus: true, fileName: true } },
      },
    });

    if (!onboarding) throw errors.notFound('Onboarding');
    if (onboarding.status === 'ACTIVE') throw errors.badRequest('This onboarding is already completed');

    if (onboarding.inviteTokenExp && new Date() > onboarding.inviteTokenExp) {
      throw errors.badRequest('Invite link has expired. Please contact HR.');
    }

    return onboarding;
  }

  /** List onboardings (HR) */
  async list(query: ListOnboardingsQuery) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));
    const skip = (page - 1) * limit;

    const where: Parameters<typeof prisma.onboarding.findMany>[0]['where'] = {};
    if (query.status?.trim()) where.status = query.status.trim();
    if (query.search?.trim()) {
      const term = `%${query.search.trim()}%`;
      where.candidateEmail = { contains: term, mode: 'insensitive' };
    }

    const [items, total] = await Promise.all([
      prisma.onboarding.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          department: { select: { id: true, name: true, code: true } },
          employee: { select: { employeeCode: true, firstName: true, lastName: true } },
        },
      }),
      prisma.onboarding.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  /** Get one by ID (HR or for candidate if token matches) */
  async getById(id: string) {
    const onboarding = await prisma.onboarding.findUnique({
      where: { id },
      include: {
        department: { select: { id: true, name: true, code: true } },
        employee: { select: { employeeCode: true, firstName: true, lastName: true, email: true } },
        personalInfo: true,
        bankDetail: true,
        emergencyContacts: true,
        educations: true,
        experiences: true,
        documents: true,
      },
    });
    if (!onboarding) throw errors.notFound('Onboarding');
    return onboarding;
  }

  /** Stage 2: Submit personal info (candidate uses invite token) */
  async submitPersonalInfoByToken(token: string, data: PersonalInfoInput) {
    const onboarding = await this.getByInviteToken(token);
    if (!onboarding) throw errors.notFound('Onboarding');

    if (!EMAIL_REGEX.test(data.personalEmail.trim())) throw errors.badRequest('Invalid personal email format');
    const mobile = data.personalMobile.replace(/\D/g, '');
    if (!PHONE_10_DIGITS.test(mobile)) throw errors.badRequest('Personal mobile must be exactly 10 digits');
    if (data.alternateMobile?.trim()) {
      const alt = data.alternateMobile.replace(/\D/g, '');
      if (!PHONE_10_DIGITS.test(alt)) throw errors.badRequest('Alternate mobile must be exactly 10 digits');
    }
    if (data.currentPincode?.trim() && data.currentPincode.length !== PINCODE_LENGTH) {
      throw errors.badRequest('Current pincode must be exactly 6 digits');
    }
    if (data.permanentPincode?.trim() && data.permanentPincode.length !== PINCODE_LENGTH) {
      throw errors.badRequest('Permanent pincode must be exactly 6 digits');
    }
    if (data.panNumber?.trim() && data.panNumber.length !== PAN_LENGTH) {
      throw errors.badRequest('PAN must be exactly 10 characters');
    }
    if (data.aadhaarNumber?.trim()) {
      const aadhaar = data.aadhaarNumber.replace(/\D/g, '');
      if (aadhaar.length !== AADHAAR_LENGTH) throw errors.badRequest('Aadhaar must be exactly 12 digits');
    }
    // Passport is optional - no validation for presence

    const dob = new Date(data.dateOfBirth);
    if (Number.isNaN(dob.getTime())) throw errors.badRequest('Invalid date of birth');

    let permanentAddress = data.permanentAddress?.trim() ?? '';
    let permanentCity = data.permanentCity?.trim() ?? '';
    let permanentState = data.permanentState?.trim() ?? '';
    let permanentPincode = data.permanentPincode?.trim() ?? '';
    let permanentCountry = data.permanentCountry?.trim() ?? '';
    if (data.isSameAsCurrent) {
      permanentAddress = data.currentAddress?.trim() ?? '';
      permanentCity = data.currentCity?.trim() ?? '';
      permanentState = data.currentState?.trim() ?? '';
      permanentPincode = data.currentPincode?.trim() ?? '';
      permanentCountry = data.currentCountry?.trim() ?? '';
    }

    const payload = {
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      middleName: data.middleName?.trim() || null,
      dateOfBirth: dob,
      gender: data.gender.trim(),
      maritalStatus: data.maritalStatus?.trim() || null,
      nationality: data.nationality.trim(),
      bloodGroup: data.bloodGroup?.trim() || null,
      personalEmail: data.personalEmail.trim().toLowerCase(),
      personalMobile: data.personalMobile.trim(),
      alternateMobile: data.alternateMobile?.trim() || null,
      currentAddress: data.currentAddress.trim(),
      currentCity: data.currentCity.trim(),
      currentState: data.currentState.trim(),
      currentPincode: data.currentPincode.trim(),
      currentCountry: data.currentCountry.trim(),
      permanentAddress,
      permanentCity,
      permanentState,
      permanentPincode,
      permanentCountry,
      panNumber: data.panNumber?.trim() || null,
      aadhaarNumber: data.aadhaarNumber?.replace(/\D/g, '') || null,
      passportNumber: data.passportNumber?.trim() || null,
      spouseName: data.spouseName?.trim() || null,
      spouseDateOfBirth: data.spouseDateOfBirth?.trim()
        ? (() => {
            const d = new Date(data.spouseDateOfBirth!);
            return Number.isNaN(d.getTime()) ? null : d;
          })()
        : null,
      childrenNames: data.childrenNames?.trim() || null,
    };

    await prisma.$transaction([
      prisma.onboardingPersonalInfo.upsert({
        where: { onboardingId: onboarding.id },
        create: { ...payload, onboardingId: onboarding.id },
        update: payload,
      }),
      prisma.onboarding.update({
        where: { id: onboarding.id },
        data: { currentStage: 3, status: 'DOCUMENTS_PENDING' },
      }),
    ]);

    return this.getByInviteToken(token);
  }

  /** Regenerate invite link (HR) */
  async regenerateInviteToken(id: string) {
    const onboarding = await prisma.onboarding.findUnique({ where: { id } });
    if (!onboarding) throw errors.notFound('Onboarding');
    if (onboarding.status === 'ACTIVE') throw errors.badRequest('Cannot regenerate link for completed onboarding');

    const inviteToken = this.generateInviteToken();
    const inviteTokenExp = new Date();
    inviteTokenExp.setDate(inviteTokenExp.getDate() + INVITE_TOKEN_EXPIRY_DAYS);

    await prisma.onboarding.update({
      where: { id },
      data: { inviteToken, inviteTokenExp },
    });

    const baseUrl = (process.env.FRONTEND_URL ?? 'http://localhost:3000').replace(/\/$/, '');
    const invitePath = `/onboarding/join/${inviteToken}`;
    const inviteLink = `${baseUrl}${invitePath}`;
    const defaultPassword = process.env.ONBOARDING_DEFAULT_PASSWORD ?? 'ChangeMe@123';
    const companyName = process.env.COMPANY_NAME ?? 'Company';
    const companyDetails = process.env.COMPANY_DETAILS ?? '';

    return {
      inviteToken,
      inviteLink: invitePath,
      inviteLinkFull: inviteLink,
      expiresAt: inviteTokenExp,
      emailContent: {
        username: onboarding.candidateEmail,
        password: defaultPassword,
        onboardingLink: inviteLink,
        companyName,
        companyDetails,
      },
    };
  }

  private allowedDocumentTypes(employeeType: string): string[] {
    const common = [...DOCUMENT_TYPES.COMMON];
    if (employeeType === 'FRESHER') return [...common, ...DOCUMENT_TYPES.FRESHER];
    if (employeeType === 'SWITCHING') return [...common, ...DOCUMENT_TYPES.SWITCHING];
    return common;
  }

  /** Stage 3: Upload document (candidate uses invite token) */
  async uploadDocumentByToken(
    token: string,
    documentType: string,
    buffer: Buffer,
    originalName: string,
    mimeType: string,
    fileSize: number
  ) {
    const onboarding = await this.getByInviteToken(token);
    const allowed = this.allowedDocumentTypes(onboarding.employeeType);
    if (!allowed.includes(documentType)) {
      throw errors.badRequest(`Invalid document type. Allowed: ${allowed.join(', ')}`);
    }
    if (!ALLOWED_DOCUMENT_MIMES.includes(mimeType)) {
      throw errors.badRequest('Allowed formats: PDF, JPG, PNG');
    }
    const maxSize = documentType === 'photo' ? MAX_PHOTO_SIZE_BYTES : MAX_DOCUMENT_SIZE_BYTES;
    if (fileSize > maxSize) {
      throw errors.badRequest(`File size must be under ${maxSize / (1024 * 1024)}MB`);
    }

    const ext = path.extname(originalName) || (mimeType === 'application/pdf' ? '.pdf' : '.jpg');
    const safeName = `${documentType}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}${ext}`;
    const dir = getOnboardingUploadDir(onboarding.id);
    const filePath = path.join(dir, safeName);
    fs.writeFileSync(filePath, buffer);

    const relativePath = path.relative(UPLOAD_DIR, filePath).replace(/\\/g, '/');

    const existing = await prisma.onboardingDocument.findFirst({
      where: { onboardingId: onboarding.id, documentType },
    });
    if (existing) {
      try {
        const absPath = path.join(UPLOAD_DIR, existing.filePath);
        if (fs.existsSync(absPath)) fs.unlinkSync(absPath);
      } catch {
        /* ignore */
      }
      await prisma.onboardingDocument.update({
        where: { id: existing.id },
        data: {
          filePath: relativePath,
          fileName: originalName,
          fileSize,
          verificationStatus: 'PENDING',
          verifiedBy: null,
          verifiedAt: null,
          rejectionReason: null,
        },
      });
      return this.getByInviteToken(token);
    }

    await prisma.onboardingDocument.create({
      data: {
        onboardingId: onboarding.id,
        documentType,
        filePath: relativePath,
        fileName: originalName,
        fileSize,
      },
    });
    return this.getByInviteToken(token);
  }

  /**
   * Stage 3 complete: candidate has uploaded at least one file for every required document type.
   * Advances to stage 4 so they can fill bank details (HR verification happens separately).
   */
  async completeDocumentUploadByToken(token: string) {
    const onboarding = await this.getByInviteToken(token);
    if (onboarding.currentStage !== 3) {
      throw errors.badRequest('Document upload completion is only available at stage 3');
    }
    const required = this.allowedDocumentTypes(onboarding.employeeType);
    const existing = await prisma.onboardingDocument.findMany({
      where: { onboardingId: onboarding.id },
      select: { documentType: true },
    });
    const uploadedTypes = new Set(existing.map((d) => d.documentType));
    const missing = required.filter((t) => !uploadedTypes.has(t));
    if (missing.length > 0) {
      throw errors.badRequest(`Upload at least one file for: ${missing.join(', ')}`);
    }
    await prisma.onboarding.update({
      where: { id: onboarding.id },
      data: { currentStage: 4 },
    });
    return this.getByInviteToken(token);
  }

  /** Resolve document and check access (by token for candidate, or HR) */
  async getDocumentForDownload(documentId: string, inviteToken?: string, isHr?: boolean) {
    const doc = await prisma.onboardingDocument.findUnique({
      where: { id: documentId },
      include: { onboarding: true },
    });
    if (!doc) throw errors.notFound('Document');
    if (inviteToken) {
      if (doc.onboarding.inviteToken !== inviteToken) throw errors.forbidden('Access denied');
    } else if (!isHr) {
      throw errors.forbidden('Access denied');
    }
    const absPath = path.join(UPLOAD_DIR, doc.filePath);
    if (!fs.existsSync(absPath)) throw errors.notFound('File not found on server');
    return { path: absPath, fileName: doc.fileName };
  }

  /** HR: Verify or reject a document */
  async verifyDocument(documentId: string, verifiedByUserId: string, verificationStatus: 'VERIFIED' | 'REJECTED', rejectionReason?: string) {
    const doc = await prisma.onboardingDocument.findUnique({
      where: { id: documentId },
      include: { onboarding: { include: { documents: true } } },
    });
    if (!doc) throw errors.notFound('Document');
    if (verificationStatus === 'REJECTED' && !rejectionReason?.trim()) {
      throw errors.badRequest('Rejection reason is required when rejecting a document');
    }

    await prisma.onboardingDocument.update({
      where: { id: documentId },
      data: {
        verificationStatus,
        verifiedBy: verifiedByUserId,
        verifiedAt: new Date(),
        rejectionReason: verificationStatus === 'REJECTED' ? (rejectionReason?.trim() || null) : null,
      },
    });

    if (verificationStatus === 'REJECTED') {
      await prisma.onboarding.update({
        where: { id: doc.onboardingId },
        data: { status: 'DOCUMENT_REJECTED' },
      });
    } else {
      const docsAfter = await prisma.onboardingDocument.findMany({
        where: { onboardingId: doc.onboardingId },
        select: { verificationStatus: true },
      });
      const allVerified = docsAfter.every((d) => d.verificationStatus === 'VERIFIED');
      if (allVerified) {
        await prisma.onboarding.update({
          where: { id: doc.onboardingId },
          data: { status: 'DOCUMENTS_VERIFIED', currentStage: 4 },
        });
      }
    }

    return prisma.onboardingDocument.findUnique({ where: { id: documentId } });
  }

  /** Stage 4: Bank details */
  async submitBankByToken(token: string, data: BankDetailInput) {
    const onboarding = await this.getByInviteToken(token);
    if (onboarding.currentStage < 4) throw errors.badRequest('Complete previous stages first');
    const payload = {
      accountHolderName: data.accountHolderName.trim(),
      bankName: data.bankName.trim(),
      branchName: data.branchName?.trim() || null,
      accountNumber: data.accountNumber.trim(),
      ifscCode: data.ifscCode.trim().toUpperCase(),
      accountType: data.accountType.trim().toLowerCase(),
    };
    if (!['savings', 'current'].includes(payload.accountType)) {
      throw errors.badRequest('accountType must be savings or current');
    }
    await prisma.$transaction([
      prisma.onboardingBankDetail.upsert({
        where: { onboardingId: onboarding.id },
        create: { ...payload, onboardingId: onboarding.id },
        update: payload,
      }),
      prisma.onboarding.update({
        where: { id: onboarding.id },
        data: { currentStage: 5 },
      }),
    ]);
    return this.getByInviteToken(token);
  }

  /** Stage 5: Emergency contacts (primary required, secondary optional) */
  async submitEmergencyContactsByToken(token: string, primary: EmergencyContactInput, secondary?: EmergencyContactInput) {
    const onboarding = await this.getByInviteToken(token);
    if (onboarding.currentStage < 5) throw errors.badRequest('Complete previous stages first');
    if (!primary.contactName?.trim() || !primary.relationship?.trim() || !primary.phone?.trim()) {
      throw errors.badRequest('Primary contact: name, relationship and phone are required');
    }
    const primaryPhone = primary.phone.replace(/\D/g, '');
    if (!PHONE_10_DIGITS.test(primaryPhone)) throw errors.badRequest('Primary emergency contact phone must be exactly 10 digits');
    if (primary.alternatePhone?.trim()) {
      const alt = primary.alternatePhone.replace(/\D/g, '');
      if (!PHONE_10_DIGITS.test(alt)) throw errors.badRequest('Primary alternate phone must be exactly 10 digits');
    }
    if (primary.email?.trim() && !EMAIL_REGEX.test(primary.email.trim())) {
      throw errors.badRequest('Primary emergency contact email format is invalid');
    }
    if (secondary?.phone?.trim()) {
      const secPhone = secondary.phone.replace(/\D/g, '');
      if (!PHONE_10_DIGITS.test(secPhone)) throw errors.badRequest('Secondary emergency contact phone must be exactly 10 digits');
    }
    if (secondary?.alternatePhone?.trim()) {
      const secAlt = secondary.alternatePhone.replace(/\D/g, '');
      if (!PHONE_10_DIGITS.test(secAlt)) throw errors.badRequest('Secondary alternate phone must be exactly 10 digits');
    }
    if (secondary?.email?.trim() && !EMAIL_REGEX.test(secondary.email.trim())) {
      throw errors.badRequest('Secondary emergency contact email format is invalid');
    }
    await prisma.$transaction([
      prisma.onboardingEmergencyContact.deleteMany({ where: { onboardingId: onboarding.id } }),
      prisma.onboardingEmergencyContact.create({
        data: {
          onboardingId: onboarding.id,
          contactName: primary.contactName.trim(),
          relationship: primary.relationship.trim(),
          phone: primary.phone.trim(),
          alternatePhone: primary.alternatePhone?.trim() || null,
          email: primary.email?.trim() || null,
          address: primary.address?.trim() || null,
          isPrimary: true,
        },
      }),
      ...(secondary?.contactName?.trim() && secondary?.phone?.trim()
        ? [
            prisma.onboardingEmergencyContact.create({
              data: {
                onboardingId: onboarding.id,
                contactName: secondary.contactName.trim(),
                relationship: secondary.relationship?.trim() || 'Other',
                phone: secondary.phone.trim(),
                alternatePhone: secondary.alternatePhone?.trim() || null,
                email: secondary.email?.trim() || null,
                address: secondary.address?.trim() || null,
                isPrimary: false,
              },
            }),
          ]
        : []),
    ]);
    await prisma.onboarding.update({
      where: { id: onboarding.id },
      data: { currentStage: 6 },
    });
    return this.getByInviteToken(token);
  }

  /** Stage 6: Education details (multiple entries) */
  async submitEducationsByToken(token: string, educations: EducationInput[]) {
    const onboarding = await this.getByInviteToken(token);
    if (onboarding.currentStage < 6) throw errors.badRequest('Complete previous stages first');
    if (!educations?.length) throw errors.badRequest('At least one education entry is required');
    for (const e of educations) {
      if (!e.qualification?.trim() || !e.institution?.trim() || !e.universityBoard?.trim() || !e.yearOfPassing) {
        throw errors.badRequest('Each education must have qualification, institution, university/board and year of passing');
      }
    }
    await prisma.onboardingEducation.deleteMany({ where: { onboardingId: onboarding.id } });
    for (const e of educations) {
      await prisma.onboardingEducation.create({
        data: {
          onboardingId: onboarding.id,
          qualification: e.qualification.trim(),
          institution: e.institution.trim(),
          universityBoard: e.universityBoard.trim(),
          yearOfPassing: Number(e.yearOfPassing),
          percentageOrCgpa: e.percentageOrCgpa?.trim() || null,
          divisionOrClass: e.divisionOrClass?.trim() || null,
          specialization: e.specialization?.trim() || null,
          startDate: e.startDate ? new Date(e.startDate) : null,
          endDate: e.endDate ? new Date(e.endDate) : null,
        },
      });
    }
    const nextStage = onboarding.employeeType === 'SWITCHING' ? 7 : 8;
    await prisma.onboarding.update({
      where: { id: onboarding.id },
      data: { currentStage: nextStage },
    });
    return this.getByInviteToken(token);
  }

  /** Stage 7: Experience details (Switching only) */
  async submitExperiencesByToken(token: string, experiences: ExperienceInput[]) {
    const onboarding = await this.getByInviteToken(token);
    if (onboarding.employeeType !== 'SWITCHING') throw errors.badRequest('Experience is only for switching candidates');
    if (onboarding.currentStage < 7) throw errors.badRequest('Complete previous stages first');
    if (!experiences?.length) throw errors.badRequest('At least one experience entry is required');
    for (const ex of experiences) {
      if (!ex.companyName?.trim() || !ex.designation?.trim() || !ex.employmentType?.trim() || !ex.startDate || !ex.endDate) {
        throw errors.badRequest('Each experience must have company, designation, employment type, start and end date');
      }
    }
    await prisma.onboardingExperience.deleteMany({ where: { onboardingId: onboarding.id } });
    for (const ex of experiences) {
      await prisma.onboardingExperience.create({
        data: {
          onboardingId: onboarding.id,
          companyName: ex.companyName.trim(),
          designation: ex.designation.trim(),
          employmentType: ex.employmentType.trim(),
          startDate: new Date(ex.startDate),
          endDate: new Date(ex.endDate),
          isCurrent: ex.isCurrent ?? false,
          reasonForLeaving: ex.reasonForLeaving?.trim() || null,
          lastDrawnSalary: ex.lastDrawnSalary?.trim() || null,
          reportingManagerName: ex.reportingManagerName?.trim() || null,
        },
      });
    }
    await prisma.onboarding.update({
      where: { id: onboarding.id },
      data: { currentStage: 8 },
    });
    return this.getByInviteToken(token);
  }

  /** Stage 8: Generate employee ID and create Employee record (HR only) */
  async generateEmployeeAndId(onboardingId: string) {
    const onboarding = await prisma.onboarding.findUnique({
      where: { id: onboardingId },
      include: {
        personalInfo: true,
        department: true,
      },
    });
    if (!onboarding) throw errors.notFound('Onboarding');
    if (onboarding.employeeId) throw errors.badRequest('Employee ID already generated for this onboarding');
    if (onboarding.currentStage < 8) throw errors.badRequest('Candidate must complete stages 1–7 (or 1–6 for Fresher) before ID generation');
    if (!onboarding.personalInfo) throw errors.badRequest('Personal information is required');
    if (!onboarding.departmentId) throw errors.badRequest('Department is required for employee ID generation');

    const empSvc = new EmployeeService();
    const employeeCode = await empSvc.generateEmployeeCodeForDepartment(onboarding.departmentId);

    const email = (onboarding.personalInfo.personalEmail || onboarding.candidateEmail).trim().toLowerCase();
    const existing = await prisma.employee.findUnique({ where: { email } });
    if (existing) throw errors.conflict('An employee with this email already exists');

    const dateOfBirth = onboarding.personalInfo.dateOfBirth && !Number.isNaN(new Date(onboarding.personalInfo.dateOfBirth).getTime())
      ? new Date(onboarding.personalInfo.dateOfBirth)
      : null;

    const employee = await prisma.employee.create({
      data: {
        employeeCode,
        firstName: onboarding.personalInfo.firstName.trim(),
        lastName: onboarding.personalInfo.lastName.trim(),
        email,
        phone: onboarding.personalInfo.personalMobile?.trim() || null,
        dateOfBirth,
        gender: onboarding.personalInfo.gender?.trim() || null,
        departmentId: onboarding.departmentId,
        designation: onboarding.designation?.trim() || null,
        dateOfJoining: new Date(),
        employmentType: 'full_time',
        status: 'active',
      },
    });

    await prisma.onboarding.update({
      where: { id: onboardingId },
      data: {
        employeeId: employee.employeeCode,
        currentStage: 9,
        status: 'IT_SETUP_PENDING',
      },
    });

    return this.getById(onboardingId);
  }

  /** Stage 9: Mark IT setup as completed (HR only) */
  async markItSetupComplete(onboardingId: string, notes?: string) {
    const onboarding = await prisma.onboarding.findUnique({
      where: { id: onboardingId },
    });
    if (!onboarding) throw errors.notFound('Onboarding');
    if (onboarding.status !== 'IT_SETUP_PENDING') {
      throw errors.badRequest(`Cannot mark IT setup complete when status is ${onboarding.status}`);
    }
    await prisma.onboarding.update({
      where: { id: onboardingId },
      data: {
        status: 'HR_REVIEW_PENDING',
        currentStage: 10,
        itSetupCompletedAt: new Date(),
        itSetupNotes: notes?.trim() || null,
      },
    });
    return this.getById(onboardingId);
  }

  /** Stage 10: HR review & activation – set ACTIVE and create User for login (HR only) */
  async activateOnboarding(onboardingId: string) {
    const onboarding = await prisma.onboarding.findUnique({
      where: { id: onboardingId },
      include: { employee: true },
    });
    if (!onboarding) throw errors.notFound('Onboarding');
    if (onboarding.status === 'ACTIVE') throw errors.badRequest('Onboarding is already active');
    if (onboarding.status !== 'HR_REVIEW_PENDING' && onboarding.status !== 'IT_SETUP_COMPLETED') {
      throw errors.badRequest('Complete IT setup and move to HR review before activating');
    }
    if (!onboarding.employeeId || !onboarding.employee) {
      throw errors.badRequest('Employee record must be created (Stage 8) before activation');
    }

    const employeeRole = await prisma.role.findUnique({ where: { name: 'employee' } });
    if (!employeeRole) throw errors.badRequest('Default employee role not found');

    const defaultPassword = process.env.ONBOARDING_DEFAULT_PASSWORD ?? 'ChangeMe@123';
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    await prisma.$transaction(async (tx) => {
      const existingUser = await tx.user.findFirst({
        where: { employeeId: onboarding.employee!.employeeCode },
      });
      if (!existingUser) {
        await tx.user.create({
          data: {
            employeeId: onboarding.employee!.employeeCode,
            email: onboarding.employee!.email.trim().toLowerCase(),
            passwordHash,
            defaultPassword: defaultPassword,
            roleId: employeeRole.id,
            isActive: true,
          },
        });
      }
      await tx.onboarding.update({
        where: { id: onboardingId },
        data: { status: 'ACTIVE' },
      });
    });

    return this.getById(onboardingId);
  }
}

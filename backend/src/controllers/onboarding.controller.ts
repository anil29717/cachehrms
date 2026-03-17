import type { Request, Response, NextFunction } from 'express';
import {
  OnboardingService,
  type PersonalInfoInput,
  type BankDetailInput,
  type EmergencyContactInput,
  type EducationInput,
  type ExperienceInput,
} from '../services/onboarding.service.js';
import { sendSuccess } from '../utils/response.js';
import { errors } from '../utils/errors.js';

const onboardingService = new OnboardingService();

function parsePersonalInfoBody(body: Record<string, unknown>): PersonalInfoInput {
  return {
    firstName: String(body.firstName ?? '').trim(),
    lastName: String(body.lastName ?? '').trim(),
    middleName: body.middleName != null ? String(body.middleName).trim() : undefined,
    dateOfBirth: String(body.dateOfBirth ?? ''),
    gender: String(body.gender ?? '').trim(),
    maritalStatus: body.maritalStatus != null ? String(body.maritalStatus).trim() : undefined,
    nationality: String(body.nationality ?? '').trim(),
    bloodGroup: body.bloodGroup != null ? String(body.bloodGroup).trim() : undefined,
    personalEmail: String(body.personalEmail ?? '').trim(),
    personalMobile: String(body.personalMobile ?? '').trim(),
    alternateMobile: body.alternateMobile != null ? String(body.alternateMobile).trim() : undefined,
    currentAddress: String(body.currentAddress ?? '').trim(),
    currentCity: String(body.currentCity ?? '').trim(),
    currentState: String(body.currentState ?? '').trim(),
    currentPincode: String(body.currentPincode ?? '').trim(),
    currentCountry: String(body.currentCountry ?? '').trim(),
    permanentAddress: String(body.permanentAddress ?? '').trim(),
    permanentCity: String(body.permanentCity ?? '').trim(),
    permanentState: String(body.permanentState ?? '').trim(),
    permanentPincode: String(body.permanentPincode ?? '').trim(),
    permanentCountry: String(body.permanentCountry ?? '').trim(),
    isSameAsCurrent: body.isSameAsCurrent === true || body.isSameAsCurrent === 'true',
    panNumber: body.panNumber != null ? String(body.panNumber).trim() : undefined,
    aadhaarNumber: body.aadhaarNumber != null ? String(body.aadhaarNumber).trim() : undefined,
    passportNumber: body.passportNumber != null ? String(body.passportNumber).trim() : undefined,
    spouseName: body.spouseName != null ? String(body.spouseName).trim() : undefined,
    spouseDateOfBirth: body.spouseDateOfBirth != null ? String(body.spouseDateOfBirth).trim() : undefined,
    childrenNames: body.childrenNames != null ? String(body.childrenNames).trim() : undefined,
  };
}

export async function createOnboarding(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = req.body as Record<string, unknown>;
    const result = await onboardingService.create({
      candidateEmail: String(body.candidateEmail ?? '').trim().toLowerCase(),
      employeeType: (body.employeeType as 'FRESHER' | 'SWITCHING') ?? 'FRESHER',
      departmentId: body.departmentId != null ? Number(body.departmentId) : undefined,
      designation: body.designation != null ? String(body.designation) : undefined,
    });
    sendSuccess(res, result, 'Onboarding created. Share the invite link with the candidate.');
  } catch (e) {
    next(e);
  }
}

/** Public: candidate loads their onboarding by invite link token */
export async function getOnboardingByToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = req.params.token;
    if (!token) {
      next(errors.badRequest('Token required'));
      return;
    }
    const result = await onboardingService.getByInviteToken(token);
    sendSuccess(res, result);
  } catch (e) {
    next(e);
  }
}

/** Public: candidate submits Stage 2 personal info (by invite token) */
export async function submitPersonalInfoByToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = req.params.token;
    if (!token) {
      next(errors.badRequest('Token required'));
      return;
    }
    const body = parsePersonalInfoBody((req.body as Record<string, unknown>) ?? {});
    if (!body.firstName || !body.lastName) {
      next(errors.badRequest('First name and last name are required'));
      return;
    }
    if (!body.dateOfBirth) {
      next(errors.badRequest('Date of birth is required'));
      return;
    }
    if (!body.gender) {
      next(errors.badRequest('Gender is required'));
      return;
    }
    if (!body.nationality) {
      next(errors.badRequest('Nationality is required'));
      return;
    }
    if (!body.personalEmail) {
      next(errors.badRequest('Personal email is required'));
      return;
    }
    if (!body.personalMobile) {
      next(errors.badRequest('Personal mobile is required'));
      return;
    }
    if (!body.currentAddress || !body.currentCity || !body.currentState || !body.currentPincode || !body.currentCountry) {
      next(errors.badRequest('Current address (address, city, state, pincode, country) is required'));
      return;
    }
    if (!body.permanentAddress || !body.permanentCity || !body.permanentState || !body.permanentPincode || !body.permanentCountry) {
      next(errors.badRequest('Permanent address is required (or check Same as current)'));
      return;
    }
    const result = await onboardingService.submitPersonalInfoByToken(token, body);
    sendSuccess(res, result, 'Personal information saved. Proceed to document upload.');
  } catch (e) {
    next(e);
  }
}

/** Public: candidate submits Stage 4 bank details */
export async function submitBankByToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = req.params.token;
    if (!token) {
      next(errors.badRequest('Token required'));
      return;
    }
    const b = req.body as Record<string, unknown>;
    const body: BankDetailInput = {
      accountHolderName: String(b.accountHolderName ?? ''),
      bankName: String(b.bankName ?? ''),
      branchName: b.branchName != null ? String(b.branchName) : undefined,
      accountNumber: String(b.accountNumber ?? ''),
      ifscCode: String(b.ifscCode ?? ''),
      accountType: String(b.accountType ?? 'savings'),
    };
    const result = await onboardingService.submitBankByToken(token, body);
    sendSuccess(res, result, 'Bank details saved.');
  } catch (e) {
    next(e);
  }
}

/** Public: candidate submits Stage 5 emergency contacts */
export async function submitEmergencyContactsByToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = req.params.token;
    if (!token) {
      next(errors.badRequest('Token required'));
      return;
    }
    const b = req.body as Record<string, unknown>;
    const primary: EmergencyContactInput = {
      contactName: String(b.primaryContactName ?? ''),
      relationship: String(b.primaryRelationship ?? ''),
      phone: String(b.primaryPhone ?? ''),
      alternatePhone: b.primaryAlternatePhone != null ? String(b.primaryAlternatePhone) : undefined,
      email: b.primaryEmail != null ? String(b.primaryEmail) : undefined,
      address: b.primaryAddress != null ? String(b.primaryAddress) : undefined,
      isPrimary: true,
    };
    const secondary: EmergencyContactInput | undefined =
      b.secondaryContactName != null && (b.secondaryContactName as string).toString().trim()
        ? {
            contactName: String(b.secondaryContactName ?? ''),
            relationship: String(b.secondaryRelationship ?? 'Other'),
            phone: String(b.secondaryPhone ?? ''),
            alternatePhone: b.secondaryAlternatePhone != null ? String(b.secondaryAlternatePhone) : undefined,
            email: b.secondaryEmail != null ? String(b.secondaryEmail) : undefined,
            address: b.secondaryAddress != null ? String(b.secondaryAddress) : undefined,
            isPrimary: false,
          }
        : undefined;
    const result = await onboardingService.submitEmergencyContactsByToken(token, primary, secondary);
    sendSuccess(res, result, 'Emergency contacts saved.');
  } catch (e) {
    next(e);
  }
}

/** Public: candidate submits Stage 6 education details */
export async function submitEducationsByToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = req.params.token;
    if (!token) {
      next(errors.badRequest('Token required'));
      return;
    }
    const arr = Array.isArray(req.body.educations) ? req.body.educations : [req.body];
    const educations: EducationInput[] = arr.map((e: Record<string, unknown>) => ({
      qualification: String(e.qualification ?? ''),
      institution: String(e.institution ?? ''),
      universityBoard: String(e.universityBoard ?? ''),
      yearOfPassing: Number(e.yearOfPassing) || new Date().getFullYear(),
      percentageOrCgpa: e.percentageOrCgpa != null ? String(e.percentageOrCgpa) : undefined,
      divisionOrClass: e.divisionOrClass != null ? String(e.divisionOrClass) : undefined,
      specialization: e.specialization != null ? String(e.specialization) : undefined,
      startDate: e.startDate != null ? String(e.startDate) : undefined,
      endDate: e.endDate != null ? String(e.endDate) : undefined,
    }));
    const result = await onboardingService.submitEducationsByToken(token, educations);
    sendSuccess(res, result, 'Education details saved.');
  } catch (e) {
    next(e);
  }
}

/** Public: candidate submits Stage 7 experience details (Switching only) */
export async function submitExperiencesByToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = req.params.token;
    if (!token) {
      next(errors.badRequest('Token required'));
      return;
    }
    const arr = Array.isArray(req.body.experiences) ? req.body.experiences : [req.body];
    const experiences: ExperienceInput[] = arr.map((ex: Record<string, unknown>) => ({
      companyName: String(ex.companyName ?? ''),
      designation: String(ex.designation ?? ''),
      employmentType: String(ex.employmentType ?? 'full_time'),
      startDate: String(ex.startDate ?? ''),
      endDate: String(ex.endDate ?? ''),
      isCurrent: ex.isCurrent === true || ex.isCurrent === 'true',
      reasonForLeaving: ex.reasonForLeaving != null ? String(ex.reasonForLeaving) : undefined,
      lastDrawnSalary: ex.lastDrawnSalary != null ? String(ex.lastDrawnSalary) : undefined,
      reportingManagerName: ex.reportingManagerName != null ? String(ex.reportingManagerName) : undefined,
    }));
    const result = await onboardingService.submitExperiencesByToken(token, experiences);
    sendSuccess(res, result, 'Experience details saved.');
  } catch (e) {
    next(e);
  }
}

export async function listOnboardings(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = req.query.page != null ? parseInt(String(req.query.page), 10) : undefined;
    const limit = req.query.limit != null ? parseInt(String(req.query.limit), 10) : undefined;
    const status = req.query.status as string | undefined;
    const search = req.query.search as string | undefined;
    const result = await onboardingService.list({ page, limit, status, search });
    sendSuccess(res, result.items, undefined, {
      page: result.page,
      limit: result.limit,
      total: result.total,
    });
  } catch (e) {
    next(e);
  }
}

export async function getOnboarding(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id;
    if (!id) {
      next(errors.badRequest('Onboarding ID required'));
      return;
    }
    const result = await onboardingService.getById(id);
    sendSuccess(res, result);
  } catch (e) {
    next(e);
  }
}

export async function regenerateInviteToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id;
    if (!id) {
      next(errors.badRequest('Onboarding ID required'));
      return;
    }
    const result = await onboardingService.regenerateInviteToken(id);
    sendSuccess(res, result, 'Invite link regenerated.');
  } catch (e) {
    next(e);
  }
}

/** Public: candidate uploads a document (multipart: file + documentType) */
export async function uploadDocumentByToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = req.params.token;
    const file = (req as Request & { file?: Express.Multer.File }).file;
    const documentType = (req.body as { documentType?: string }).documentType;

    if (!token) {
      next(errors.badRequest('Token required'));
      return;
    }
    if (!file?.buffer) {
      next(errors.badRequest('No file uploaded. Use field name "file".'));
      return;
    }
    if (!documentType?.trim()) {
      next(errors.badRequest('documentType is required (e.g. photo, identity_proof, pan_card)'));
      return;
    }

    const result = await onboardingService.uploadDocumentByToken(
      token,
      documentType.trim(),
      file.buffer,
      file.originalname || 'document',
      file.mimetype || 'application/octet-stream',
      file.size
    );
    sendSuccess(res, result, 'Document uploaded.');
  } catch (e) {
    next(e);
  }
}

/** Public: candidate marks document upload complete and advances to stage 4 (bank details) */
export async function completeDocumentUploadByToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = req.params.token;
    if (!token) {
      next(errors.badRequest('Token required'));
      return;
    }
    const result = await onboardingService.completeDocumentUploadByToken(token);
    sendSuccess(res, result, 'You can now fill bank details.');
  } catch (e) {
    next(e);
  }
}

/** Stream document file: candidate uses ?token=xxx, HR uses auth */
export async function getDocumentFile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const documentId = req.params.documentId;
    const token = req.query.token as string | undefined;
    const isHr = req.user?.roleName && ['super_admin', 'hr_admin'].includes(req.user.roleName);

    if (!documentId) {
      next(errors.badRequest('Document ID required'));
      return;
    }
    if (!token && !isHr) {
      next(errors.forbidden('Provide ?token= for candidate access or log in as HR'));
      return;
    }
    const { path: filePath, fileName } = await onboardingService.getDocumentForDownload(documentId, token, isHr);
    const safeName = fileName.replace(/[^\w.-]/g, '_');
    res.setHeader('Content-Disposition', `inline; filename="${safeName}"`);
    res.sendFile(filePath, (err) => {
      if (err) next(err);
    });
  } catch (e) {
    next(e);
  }
}

/** HR: Verify or reject a document */
export async function verifyDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const documentId = req.params.documentId;
    const userId = req.user?.userId;
    const body = (req.body as { verificationStatus?: string; rejectionReason?: string }) ?? {};

    if (!documentId) {
      next(errors.badRequest('Document ID required'));
      return;
    }
    if (!userId) {
      next(errors.unauthorized('Authentication required'));
      return;
    }
    const status = body.verificationStatus?.toUpperCase();
    if (status !== 'VERIFIED' && status !== 'REJECTED') {
      next(errors.badRequest('verificationStatus must be VERIFIED or REJECTED'));
      return;
    }

    const result = await onboardingService.verifyDocument(
      documentId,
      userId,
      status as 'VERIFIED' | 'REJECTED',
      body.rejectionReason
    );
    sendSuccess(res, result, status === 'VERIFIED' ? 'Document verified' : 'Document rejected');
  } catch (e) {
    next(e);
  }
}

/** HR: Stage 8 – Generate employee ID and create Employee record */
export async function generateEmployeeId(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id;
    if (!id) {
      next(errors.badRequest('Onboarding ID required'));
      return;
    }
    const result = await onboardingService.generateEmployeeAndId(id);
    sendSuccess(res, result, 'Employee ID generated.');
  } catch (e) {
    next(e);
  }
}

/** HR: Stage 9 – Mark IT setup as completed */
export async function markItSetupComplete(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id;
    const notes = (req.body as { notes?: string })?.notes;
    if (!id) {
      next(errors.badRequest('Onboarding ID required'));
      return;
    }
    const result = await onboardingService.markItSetupComplete(id, notes);
    sendSuccess(res, result, 'IT setup marked complete.');
  } catch (e) {
    next(e);
  }
}

/** HR: Stage 10 – Activate onboarding (create User, set ACTIVE) */
export async function activateOnboarding(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id;
    if (!id) {
      next(errors.badRequest('Onboarding ID required'));
      return;
    }
    const result = await onboardingService.activateOnboarding(id);
    sendSuccess(res, result, 'Onboarding completed. Employee can log in.');
  } catch (e) {
    next(e);
  }
}

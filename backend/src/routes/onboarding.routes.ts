import { Router } from 'express';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.js';
import { requireScopeView } from '../middleware/requireScope.js';
import { requireHROrAdmin } from '../middleware/requireHROrAdmin.js';
import { uploadDocumentMiddleware } from '../middleware/uploadDocument.js';
import {
  createOnboarding,
  getOnboardingByToken,
  submitPersonalInfoByToken,
  uploadDocumentByToken,
  submitBankByToken,
  submitEmergencyContactsByToken,
  submitEducationsByToken,
  submitExperiencesByToken,
  getDocumentFile,
  completeDocumentUploadByToken,
  verifyDocument,
  listOnboardings,
  getOnboarding,
  regenerateInviteToken,
  generateEmployeeId,
  markItSetupComplete,
  activateOnboarding,
} from '../controllers/onboarding.controller.js';

const router = Router();

/** Public: candidate accesses onboarding by invite link (no auth) */
router.get('/by-token/:token', getOnboardingByToken);
/** Public: candidate submits Stage 2 personal info */
router.put('/by-token/:token/personal-info', submitPersonalInfoByToken);
/** Public: candidate uploads document (multipart: file + documentType) */
router.post('/by-token/:token/documents', uploadDocumentMiddleware, uploadDocumentByToken);
/** Public: candidate marks document upload complete and advances to stage 4 */
router.post('/by-token/:token/complete-document-upload', completeDocumentUploadByToken);
/** Public: candidate submits Stage 4 bank details */
router.put('/by-token/:token/bank', submitBankByToken);
/** Public: candidate submits Stage 5 emergency contacts */
router.put('/by-token/:token/emergency-contacts', submitEmergencyContactsByToken);
/** Public: candidate submits Stage 6 education details */
router.put('/by-token/:token/educations', submitEducationsByToken);
/** Public: candidate submits Stage 7 experience details (Switching only) */
router.put('/by-token/:token/experiences', submitExperiencesByToken);

/** Document file: candidate with ?token=xxx or HR with auth */
router.get('/documents/:documentId/file', optionalAuthMiddleware, getDocumentFile);

/** HR only */
router.post('/', authMiddleware, requireScopeView('employees'), requireHROrAdmin, createOnboarding);
router.get('/', authMiddleware, requireScopeView('employees'), requireHROrAdmin, listOnboardings);
router.get('/:id', authMiddleware, requireScopeView('employees'), requireHROrAdmin, getOnboarding);
router.post('/:id/regenerate-invite', authMiddleware, requireScopeView('employees'), requireHROrAdmin, regenerateInviteToken);
router.post('/:id/generate-employee-id', authMiddleware, requireScopeView('employees'), requireHROrAdmin, generateEmployeeId);
router.post('/:id/mark-it-setup-complete', authMiddleware, requireScopeView('employees'), requireHROrAdmin, markItSetupComplete);
router.post('/:id/activate', authMiddleware, requireScopeView('employees'), requireHROrAdmin, activateOnboarding);
router.patch('/documents/:documentId/verify', authMiddleware, requireScopeView('employees'), requireHROrAdmin, verifyDocument);

export const onboardingRoutes = router;

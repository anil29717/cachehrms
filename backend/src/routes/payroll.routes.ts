import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { requireScopeView } from '../middleware/requireScope.js';
import { requireHROrAdmin } from '../middleware/requireHROrAdmin.js';
import {
  listSalaryStructures,
  getSalaryStructure,
  upsertSalaryStructure,
  listPayroll,
  generatePayroll,
  updatePaymentStatus,
  getPayrollById,
  getMyPayslips,
  getPayslip,
} from '../controllers/payroll.controller.js';

const router = Router();

router.use(authMiddleware);
router.use(requireScopeView('payroll'));

router.get('/my-payslips', (req, res, next) => getMyPayslips(req, res, next));
router.get('/payslip/:id', (req, res, next) => getPayslip(req, res, next));

router.get('/salary-structures', requireHROrAdmin, (req, res, next) => listSalaryStructures(req, res, next));
router.get('/salary-structures/:employeeId', requireHROrAdmin, (req, res, next) => getSalaryStructure(req, res, next));
router.put('/salary-structures/:employeeId', requireHROrAdmin, (req, res, next) => upsertSalaryStructure(req, res, next));
router.post('/salary-structures', requireHROrAdmin, (req, res, next) => {
  const eid = (req.body as { employeeId?: string }).employeeId;
  req.params.employeeId = eid ?? '';
  return upsertSalaryStructure(req, res, next);
});

router.get('/runs', requireHROrAdmin, (req, res, next) => listPayroll(req, res, next));
router.post('/generate', requireHROrAdmin, (req, res, next) => generatePayroll(req, res, next));
router.get('/runs/:id', requireHROrAdmin, (req, res, next) => getPayrollById(req, res, next));
router.put('/runs/:id/status', requireHROrAdmin, (req, res, next) => updatePaymentStatus(req, res, next));

export const payrollRoutes = router;

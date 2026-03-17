import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { requireHROrAdmin } from '../middleware/requireHROrAdmin.js';
import { listCategories, createCategory } from '../controllers/assetCategory.controller.js';

const router = Router();

router.use(authMiddleware);

router.get('/', (req, res, next) => listCategories(req, res, next));
router.post('/', requireHROrAdmin, (req, res, next) => createCategory(req, res, next));

export const assetCategoryRoutes = router;

import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { requireScopeView } from '../middleware/requireScope.js';
import { requireHROrAdmin } from '../middleware/requireHROrAdmin.js';
import {
  listAssets,
  getAssetById,
  createAsset,
  updateAsset,
  deleteAsset,
} from '../controllers/asset.controller.js';

const router = Router();

router.use(authMiddleware);
router.use(requireScopeView('assets'));

router.get('/', (req, res, next) => listAssets(req, res, next));
router.get('/:id', (req, res, next) => getAssetById(req, res, next));
router.post('/', requireHROrAdmin, (req, res, next) => createAsset(req, res, next));
router.put('/:id', requireHROrAdmin, (req, res, next) => updateAsset(req, res, next));
router.delete('/:id', requireHROrAdmin, (req, res, next) => deleteAsset(req, res, next));

export const assetRoutes = router;

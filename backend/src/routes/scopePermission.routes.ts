import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { getScopesTree, getUserPermissions, setUserPermissions } from '../controllers/scopePermission.controller.js';

const router = Router();

router.use(authMiddleware);
router.use(requireAdmin);

router.get('/scopes', getScopesTree);
router.get('/user', getUserPermissions);
router.put('/user', setUserPermissions);

export const scopePermissionRoutes = router;

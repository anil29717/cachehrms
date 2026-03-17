import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { requireScopeView } from '../middleware/requireScope.js';
import { requireHROrAdmin } from '../middleware/requireHROrAdmin.js';
import {
  listAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  publishAnnouncement,
  markRead,
  getBirthdays,
  getUpcomingHolidays,
  getAssetReminders,
  getReport,
  getNationalHolidays,
} from '../controllers/announcement.controller.js';

const router = Router();

router.use(authMiddleware);
router.use(requireScopeView('announcements'));

router.get('/', (req, res, next) => listAnnouncements(req, res, next));
router.get('/report', (req, res, next) => getReport(req, res, next));
router.get('/national-holidays', (req, res, next) => getNationalHolidays(req, res, next));
router.get('/birthdays', (req, res, next) => getBirthdays(req, res, next));
router.get('/holidays/upcoming', (req, res, next) => getUpcomingHolidays(req, res, next));
router.get('/asset-reminders', (req, res, next) => getAssetReminders(req, res, next));
router.get('/:id', (req, res, next) => getAnnouncementById(req, res, next));
router.post('/', requireHROrAdmin, (req, res, next) => createAnnouncement(req, res, next));
router.put('/:id', requireHROrAdmin, (req, res, next) => updateAnnouncement(req, res, next));
router.delete('/:id', requireHROrAdmin, (req, res, next) => deleteAnnouncement(req, res, next));
router.post('/:id/publish', requireHROrAdmin, (req, res, next) => publishAnnouncement(req, res, next));
router.post('/:id/read', (req, res, next) => markRead(req, res, next));

export const announcementRoutes = router;

import express from 'express';
import { adminLogin, checkAuth, getAttendanceData, sendTicketEmailToUser } from '../controllers/admin.controller.js';
import { requireAdminAuth } from '../controllers/auth.controller.js';

const router = express.Router();

router.post('/login', adminLogin);
router.get('/check-auth', checkAuth);
router.get('/attendance', getAttendanceData);
router.post('/send-email', requireAdminAuth, sendTicketEmailToUser);

export default router;

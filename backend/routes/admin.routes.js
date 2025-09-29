import express from 'express';
import { adminLogin, checkAuth, getAttendanceData } from '../controllers/admin.controller.js';

const router = express.Router();

router.post('/login', adminLogin);
router.get('/check-auth', checkAuth);
router.get('/attendance', getAttendanceData);

export default router;

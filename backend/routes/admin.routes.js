import express from 'express';
import { adminLogin, getAttendanceData } from '../controllers/admin.controller.js';

const router = express.Router();

router.post('/login', adminLogin);
router.get('/attendance', getAttendanceData);

export default router;

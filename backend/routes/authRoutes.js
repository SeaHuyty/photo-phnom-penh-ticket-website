import express from 'express';
import { 
    requireAdminAuth,
    scanPage, 
    sendEmailPage, 
    checkAuth 
} from '../controllers/authController.js';

const router = express.Router();

router.get('/scan', requireAdminAuth, scanPage);
router.get('/send-email', requireAdminAuth, sendEmailPage);
router.get('/check-auth', requireAdminAuth, checkAuth);

export default router;

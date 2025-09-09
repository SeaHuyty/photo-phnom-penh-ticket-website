import express from 'express';
import { 
    registerUser, 
    verifyQrCode, 
    getEvents, 
    getUsers 
} from '../controllers/userController.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/verify', verifyQrCode);
router.get('/events', getEvents);
router.get('/users', getUsers);

export default router;

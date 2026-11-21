import express from 'express';
import { login, verifyLogin } from '../controllers/authController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.post('/login', login);
router.get('/verify', authMiddleware, verifyLogin);

export default router;

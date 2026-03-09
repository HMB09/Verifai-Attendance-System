import express from 'express';
import { register, login } from '../controllers/auth.controller.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.middleware.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

// Register (Admin only)
router.post('/register', authMiddleware, roleMiddleware(ROLES.ADMIN), register);

// Login (Public)
router.post('/login', login);

export default router;

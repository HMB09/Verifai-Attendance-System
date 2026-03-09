import express from 'express';
import { registerFace, getFaceStatus } from '../controllers/face.controller.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.middleware.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

// Face registration (Student only)
router.post('/register', authMiddleware, roleMiddleware(ROLES.STUDENT), registerFace);

// Check face registration status (Student only)
router.get('/status', authMiddleware, roleMiddleware(ROLES.STUDENT), getFaceStatus);

export default router;

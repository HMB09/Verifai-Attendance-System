import express from 'express';
import { getMyProfile, getMyAttendance, getMyCourses } from '../controllers/student.controller.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.middleware.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

// Get student's own profile
router.get('/profile', authMiddleware, roleMiddleware(ROLES.STUDENT), getMyProfile);

// Get student's own attendance records
router.get('/attendance', authMiddleware, roleMiddleware(ROLES.STUDENT), getMyAttendance);

// Get student's courses
router.get('/courses', authMiddleware, roleMiddleware(ROLES.STUDENT), getMyCourses);

export default router;

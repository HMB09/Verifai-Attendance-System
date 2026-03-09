import express from 'express';
import { getMyCourses, getCourseStudents } from '../controllers/teacher.controller.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.middleware.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

// All teacher routes require TEACHER or ADMIN role
router.use(authMiddleware, roleMiddleware(ROLES.TEACHER, ROLES.ADMIN));

// Get courses taught by this teacher
router.get('/courses', getMyCourses);

// Get students enrolled in a specific course
router.get('/courses/:courseId/students', getCourseStudents);

export default router;

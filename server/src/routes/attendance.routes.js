import express from 'express';
import {
  createSession,
  closeSession,
  recognizeAndMark,
  getStudentAttendance,
  getCourseAttendance,
  exportAttendance,
  getCourseAttendanceSessions,
  getSessionAttendanceDetails,
} from '../controllers/attendance.controller.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.middleware.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

// Create attendance session (Teacher only)
router.post('/session', authMiddleware, roleMiddleware(ROLES.TEACHER), createSession);

// Close attendance session (Teacher only)
router.patch('/session/:id/close', authMiddleware, roleMiddleware(ROLES.TEACHER), closeSession);

// Get session details with student attendance (Teacher only)
router.get('/session/:sessionId/details', authMiddleware, roleMiddleware(ROLES.TEACHER), getSessionAttendanceDetails);

// Recognize and mark attendance (Teacher only)
router.post('/recognize', authMiddleware, roleMiddleware(ROLES.TEACHER), recognizeAndMark);

// Get student attendance (Student can view own, Teacher/Admin can view any)
router.get('/student/:studentId', authMiddleware, getStudentAttendance);

// Get course attendance sessions with stats (Teacher/Admin)
router.get('/course/:courseId/sessions', authMiddleware, roleMiddleware(ROLES.TEACHER, ROLES.ADMIN), getCourseAttendanceSessions);

// Get course attendance (Teacher/Admin)
router.get('/course/:courseId', authMiddleware, roleMiddleware(ROLES.TEACHER, ROLES.ADMIN), getCourseAttendance);

// Export attendance as CSV (Teacher/Admin)
router.get('/export', authMiddleware, roleMiddleware(ROLES.TEACHER, ROLES.ADMIN), exportAttendance);

export default router;

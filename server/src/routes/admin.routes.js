import express from 'express';
import {
  createUser,
  getUsers,
  updateUser,
  deleteUser,
  createStudent,
  getStudents,
  updateStudent,
  deleteStudent,
  createCourse,
  getCourses,
  updateCourse,
  deleteCourse,
  createEnrollment,
  getEnrollments,
  deleteEnrollment,
  registerStudentFace,
} from '../controllers/admin.controller.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.middleware.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

// All admin routes require ADMIN role
router.use(authMiddleware, roleMiddleware(ROLES.ADMIN));

// User management
router.post('/users', createUser);
router.get('/users', getUsers);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

// Student management
router.post('/students', createStudent);
router.get('/students', getStudents);
router.put('/students/:id', updateStudent);
router.delete('/students/:id', deleteStudent);

// Course management
router.post('/courses', createCourse);
router.get('/courses', getCourses);
router.put('/courses/:id', updateCourse);
router.delete('/courses/:id', deleteCourse);

// Enrollment management
router.post('/enrollments', createEnrollment);
router.get('/enrollments', getEnrollments);
router.delete('/enrollments/:id', deleteEnrollment);

// Face registration for students
router.post('/face/register', registerStudentFace);

export default router;

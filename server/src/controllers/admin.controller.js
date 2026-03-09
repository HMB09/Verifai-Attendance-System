import User from '../models/User.model.js';
import Student from '../models/Student.model.js';
import Course from '../models/Course.model.js';
import Enrollment from '../models/Enrollment.model.js';
import FaceEmbedding from '../models/FaceEmbedding.model.js';
import { encryptEmbedding } from '../utils/crypto.util.js';
import { ROLES } from '../config/constants.js';

// User Management
export const createUser = async (req, res, next) => {
  try {
    console.log('[Admin Controller] createUser called');
    console.log('[Admin Controller] Request body:', { ...req.body, password: '***' });
    
    const { name, email, password, role, studentData } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('[Admin Controller] User already exists with email:', email);
      return res.status(400).json({ error: 'User already exists' });
    }

    console.log('[Admin Controller] Creating new user...');
    const user = new User({ name, email, passwordHash: password, role });
    await user.save();
    console.log('[Admin Controller] User created:', user._id, user.email);

    if (role === ROLES.STUDENT && studentData) {
      console.log('[Admin Controller] Creating student record...');
      const student = new Student({
        userId: user._id,
        ...studentData,
      });
      await student.save();
      console.log('[Admin Controller] Student record created:', student._id);
    }

    const responseUser = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    };
    console.log('[Admin Controller] Sending response:', responseUser);
    res.status(201).json({ message: 'User created', user: responseUser });
  } catch (error) {
    console.error('[Admin Controller] Error in createUser:', error);
    next(error);
  }
};

export const getUsers = async (req, res, next) => {
  try {
    console.log('[Admin Controller] getUsers called');
    const users = await User.find().select('-passwordHash');
    console.log('[Admin Controller] Found', users.length, 'users');
    res.json({ users });
  } catch (error) {
    console.error('[Admin Controller] Error in getUsers:', error);
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    console.log('[Admin Controller] updateUser called');
    const { id } = req.params;
    const updates = req.body;
    console.log('[Admin Controller] Updating user:', id, 'with updates:', { ...updates, password: updates.password ? '***' : undefined });

    if (updates.passwordHash) {
      // Password will be hashed by pre-save hook
    }

    const user = await User.findByIdAndUpdate(id, updates, { new: true }).select('-passwordHash');
    if (!user) {
      console.error('[Admin Controller] User not found:', id);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('[Admin Controller] User updated successfully:', user._id);
    res.json({ message: 'User updated', user });
  } catch (error) {
    console.error('[Admin Controller] Error in updateUser:', error);
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    console.log('[Admin Controller] deleteUser called for userId:', req.params.id);
    const { id } = req.params;

    // Find user first to check if it exists
    const user = await User.findById(id);
    if (!user) {
      console.error('[Admin Controller] User not found:', id);
      return res.status(404).json({ error: 'User not found' });
    }
    console.log('[Admin Controller] User found:', user.email, 'role:', user.role);

    // If it's a student, delete related records
    if (user.role === ROLES.STUDENT) {
      console.log('[Admin Controller] User is a student, finding student record...');
      const student = await Student.findOne({ userId: id });
      if (student) {
        console.log('[Admin Controller] Student record found:', student._id);
        
        // Delete face embedding
        console.log('[Admin Controller] Deleting face embedding...');
        const faceDeleted = await FaceEmbedding.deleteOne({ studentId: student._id });
        console.log('[Admin Controller] Face embedding deleted:', faceDeleted.deletedCount, 'records');
        
        // Delete enrollments
        console.log('[Admin Controller] Deleting enrollments...');
        const enrollmentsDeleted = await Enrollment.deleteMany({ studentId: student._id });
        console.log('[Admin Controller] Enrollments deleted:', enrollmentsDeleted.deletedCount, 'records');
        
        // Delete student record
        console.log('[Admin Controller] Deleting student record...');
        await Student.findByIdAndDelete(student._id);
        console.log('[Admin Controller] Student record deleted');
      } else {
        console.log('[Admin Controller] No student record found for this user');
      }
    }

    // Delete the user
    console.log('[Admin Controller] Deleting user record...');
    await User.findByIdAndDelete(id);
    console.log('[Admin Controller] User deleted successfully:', id);
    
    res.json({ message: 'User deleted' });
  } catch (error) {
    console.error('[Admin Controller] Error in deleteUser:', error);
    next(error);
  }
};

// Student Management
export const createStudent = async (req, res, next) => {
  try {
    console.log('[Admin Controller] createStudent called');
    console.log('[Admin Controller] Request body:', req.body);
    const student = new Student(req.body);
    await student.save();
    console.log('[Admin Controller] Student created:', student._id);
    res.status(201).json({ message: 'Student created', student });
  } catch (error) {
    console.error('[Admin Controller] Error in createStudent:', error);
    next(error);
  }
};

export const getStudents = async (req, res, next) => {
  try {
    console.log('[Admin Controller] getStudents called');
    const students = await Student.find().populate('userId', 'name email');
    console.log('[Admin Controller] Found', students.length, 'students');
    res.json({ students });
  } catch (error) {
    console.error('[Admin Controller] Error in getStudents:', error);
    next(error);
  }
};

export const updateStudent = async (req, res, next) => {
  try {
    console.log('[Admin Controller] updateStudent called for studentId:', req.params.id);
    console.log('[Admin Controller] Request body:', req.body);
    const { id } = req.params;
    const student = await Student.findByIdAndUpdate(id, req.body, { new: true });
    if (!student) {
      console.error('[Admin Controller] Student not found:', id);
      return res.status(404).json({ error: 'Student not found' });
    }
    console.log('[Admin Controller] Student updated successfully:', student._id);
    res.json({ message: 'Student updated', student });
  } catch (error) {
    console.error('[Admin Controller] Error in updateStudent:', error);
    next(error);
  }
};

export const deleteStudent = async (req, res, next) => {
  try {
    console.log('[Admin Controller] deleteStudent called for studentId:', req.params.id);
    const { id } = req.params;
    await Student.findByIdAndDelete(id);
    console.log('[Admin Controller] Student deleted:', id);
    res.json({ message: 'Student deleted' });
  } catch (error) {
    console.error('[Admin Controller] Error in deleteStudent:', error);
    next(error);
  }
};

// Course Management
export const createCourse = async (req, res, next) => {
  try {
    console.log('[Admin Controller] createCourse called');
    console.log('[Admin Controller] Request body:', req.body);
    const course = new Course(req.body);
    await course.save();
    console.log('[Admin Controller] Course created:', course._id, course.code);
    res.status(201).json({ message: 'Course created', course });
  } catch (error) {
    console.error('[Admin Controller] Error in createCourse:', error);
    next(error);
  }
};

export const getCourses = async (req, res, next) => {
  try {
    console.log('[Admin Controller] getCourses called');
    const courses = await Course.find().populate('teacherId', 'name email');
    console.log('[Admin Controller] Found', courses.length, 'courses');
    res.json({ courses });
  } catch (error) {
    console.error('[Admin Controller] Error in getCourses:', error);
    next(error);
  }
};

export const updateCourse = async (req, res, next) => {
  try {
    console.log('[Admin Controller] updateCourse called for courseId:', req.params.id);
    console.log('[Admin Controller] Request body:', req.body);
    const { id } = req.params;
    const course = await Course.findByIdAndUpdate(id, req.body, { new: true });
    if (!course) {
      console.error('[Admin Controller] Course not found:', id);
      return res.status(404).json({ error: 'Course not found' });
    }
    console.log('[Admin Controller] Course updated successfully:', course._id);
    res.json({ message: 'Course updated', course });
  } catch (error) {
    console.error('[Admin Controller] Error in updateCourse:', error);
    next(error);
  }
};

export const deleteCourse = async (req, res, next) => {
  try {
    console.log('[Admin Controller] deleteCourse called for courseId:', req.params.id);
    const { id } = req.params;
    await Course.findByIdAndDelete(id);
    console.log('[Admin Controller] Course deleted:', id);
    res.json({ message: 'Course deleted' });
  } catch (error) {
    console.error('[Admin Controller] Error in deleteCourse:', error);
    next(error);
  }
};

// Enrollment Management
export const createEnrollment = async (req, res, next) => {
  try {
    console.log('[Admin Controller] createEnrollment called');
    console.log('[Admin Controller] Request body:', req.body);
    const enrollment = new Enrollment(req.body);
    await enrollment.save();
    console.log('[Admin Controller] Enrollment created:', enrollment._id);
    res.status(201).json({ message: 'Enrollment created', enrollment });
  } catch (error) {
    console.error('[Admin Controller] Error in createEnrollment:', error);
    next(error);
  }
};

export const getEnrollments = async (req, res, next) => {
  try {
    console.log('[Admin Controller] getEnrollments called');
    const enrollments = await Enrollment.find()
      .populate('courseId', 'code name')
      .populate('studentId', 'studentId')
      .populate({
        path: 'studentId',
        populate: { path: 'userId', select: 'name email' },
      });
    console.log('[Admin Controller] Found', enrollments.length, 'enrollments');
    res.json({ enrollments });
  } catch (error) {
    console.error('[Admin Controller] Error in getEnrollments:', error);
    next(error);
  }
};

export const deleteEnrollment = async (req, res, next) => {
  try {
    console.log('[Admin Controller] deleteEnrollment called for enrollmentId:', req.params.id);
    const { id } = req.params;
    await Enrollment.findByIdAndDelete(id);
    console.log('[Admin Controller] Enrollment deleted:', id);
    res.json({ message: 'Enrollment deleted' });
  } catch (error) {
    console.error('[Admin Controller] Error in deleteEnrollment:', error);
    next(error);
  }
};

// Face Registration for Students (Admin only)
export const registerStudentFace = async (req, res, next) => {
  try {
    console.log('[Admin Controller] registerStudentFace called');
    console.log('[Admin Controller] Request body - userId:', req.body.userId, 'embedding length:', req.body.embedding?.length);
    
    const { userId, embedding } = req.body;

    if (!userId || !embedding || !Array.isArray(embedding)) {
      console.error('[Admin Controller] Invalid request - userId or embedding missing');
      return res.status(400).json({ error: 'userId and valid embedding array are required' });
    }

    console.log('[Admin Controller] Finding student record for userId:', userId);
    // Find student record for this user
    const student = await Student.findOne({ userId });
    if (!student) {
      console.error('[Admin Controller] Student record not found for userId:', userId);
      return res.status(404).json({ error: 'Student record not found for this user' });
    }
    console.log('[Admin Controller] Student found:', student._id);

    console.log('[Admin Controller] Encrypting embedding...');
    // Encrypt embedding
    const encryptedEmbedding = encryptEmbedding(embedding);
    console.log('[Admin Controller] Embedding encrypted successfully');

    console.log('[Admin Controller] Saving face embedding to database...');
    // Update or create face embedding
    const faceEmbedding = await FaceEmbedding.findOneAndUpdate(
      { studentId: student._id },
      {
        studentId: student._id,
        embeddingEncrypted: encryptedEmbedding,
        model: 'face-api.js-resnet',
      },
      { upsert: true, new: true }
    );
    console.log('[Admin Controller] Face embedding saved:', faceEmbedding._id);

    res.json({
      message: 'Face embedding registered successfully',
      faceEmbeddingId: faceEmbedding._id,
    });
  } catch (error) {
    console.error('[Admin Controller] Error in registerStudentFace:', error);
    next(error);
  }
};

import Course from '../models/Course.model.js';
import Student from '../models/Student.model.js';
import Enrollment from '../models/Enrollment.model.js';

// Get courses taught by the teacher
export const getMyCourses = async (req, res, next) => {
  try {
    const teacherId = req.user.id;
    const courses = await Course.find({ teacherId });
    res.json({ courses });
  } catch (error) {
    next(error);
  }
};

// Get students enrolled in a specific course
export const getCourseStudents = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const teacherId = req.user.id;

    // Verify the course belongs to this teacher
    const course = await Course.findOne({ _id: courseId, teacherId });
    if (!course) {
      return res.status(403).json({ error: 'Unauthorized to access this course' });
    }

    // Get enrollments for this course
    const enrollments = await Enrollment.find({ courseId }).populate('studentId');
    const students = enrollments.map(e => e.studentId);

    res.json({ students, enrollments });
  } catch (error) {
    next(error);
  }
};

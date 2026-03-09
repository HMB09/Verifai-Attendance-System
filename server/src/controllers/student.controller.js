import Student from '../models/Student.model.js';
import AttendanceRecord from '../models/AttendanceRecord.model.js';
import AttendanceSession from '../models/AttendanceSession.model.js';
import Course from '../models/Course.model.js';
import { ATTENDANCE_STATUS } from '../config/constants.js';

// Get student's own profile
export const getMyProfile = async (req, res, next) => {
  try {
    console.log('[Student Controller] getMyProfile called for userId:', req.user.id);
    const student = await Student.findOne({ userId: req.user.id }).populate('userId', 'name email');
    
    if (!student) {
      console.error('[Student Controller] Student profile not found');
      return res.status(404).json({ error: 'Student profile not found' });
    }

    console.log('[Student Controller] Student found:', student.studentId);
    res.json({ 
      student: {
        id: student._id,
        studentId: student.studentId,
        department: student.department,
        year: student.year,
        section: student.section,
        name: student.userId.name,
        email: student.userId.email,
      }
    });
  } catch (error) {
    console.error('[Student Controller] Error in getMyProfile:', error);
    next(error);
  }
};

// Get student's own attendance records
export const getMyAttendance = async (req, res, next) => {
  try {
    console.log('[Student Controller] getMyAttendance called for userId:', req.user.id);
    
    // Get student record
    const student = await Student.findOne({ userId: req.user.id });
    if (!student) {
      console.error('[Student Controller] Student profile not found');
      return res.status(404).json({ error: 'Student profile not found' });
    }

    console.log('[Student Controller] Student found:', student.studentId);

    // Get student's courses
    const courses = await Course.find({
      department: student.department,
      year: student.year,
      section: student.section,
    });

    console.log('[Student Controller] Found', courses.length, 'courses for student');

    // Get attendance records
    const records = await AttendanceRecord.find({ studentId: student._id })
      .populate({
        path: 'sessionId',
        populate: {
          path: 'courseId',
          select: 'code name department'
        }
      })
      .sort({ timestamp: -1 });

    console.log('[Student Controller] Found', records.length, 'attendance records');

    // Transform records to include course info
    const transformedRecords = records.map(record => ({
      _id: record._id,
      timestamp: record.timestamp,
      status: record.status,
      markedBy: record.markedBy,
      sessionId: {
        _id: record.sessionId?._id,
        startTime: record.sessionId?.startTime,
        endTime: record.sessionId?.endTime,
        courseId: {
          _id: record.sessionId?.courseId?._id,
          code: record.sessionId?.courseId?.code,
          name: record.sessionId?.courseId?.name,
          department: record.sessionId?.courseId?.department,
        }
      }
    }));

    // Calculate course-wise attendance
    const courseAttendance = await Promise.all(
      courses.map(async (course) => {
        // Get all sessions for this course
        const sessions = await AttendanceSession.find({
          courseId: course._id,
          status: 'CLOSED'
        });

        const totalSessions = sessions.length;
        
        // Get student's attendance for this course
        const sessionIds = sessions.map(s => s._id);
        const studentAttendance = await AttendanceRecord.countDocuments({
          studentId: student._id,
          sessionId: { $in: sessionIds },
          status: ATTENDANCE_STATUS.PRESENT
        });

        const percentage = totalSessions > 0 ? ((studentAttendance / totalSessions) * 100).toFixed(1) : 0;

        return {
          courseId: course._id,
          courseCode: course.code,
          courseName: course.name,
          totalSessions,
          attended: studentAttendance,
          percentage: parseFloat(percentage)
        };
      })
    );

    // Calculate overall stats
    const totalSessions = courseAttendance.reduce((sum, c) => sum + c.totalSessions, 0);
    const presentCount = records.filter(r => r.status === ATTENDANCE_STATUS.PRESENT).length;
    const percentage = totalSessions > 0 ? ((presentCount / totalSessions) * 100).toFixed(1) : 0;

    console.log('[Student Controller] Overall Stats - Total sessions:', totalSessions, 'Present:', presentCount, 'Percentage:', percentage);
    console.log('[Student Controller] Course-wise attendance:', courseAttendance);

    res.json({ 
      records: transformedRecords,
      courseAttendance,
      stats: {
        total: totalSessions,
        present: presentCount,
        percentage: parseFloat(percentage)
      }
    });
  } catch (error) {
    console.error('[Student Controller] Error in getMyAttendance:', error);
    next(error);
  }
};

// Get student's courses based on department, year, section
export const getMyCourses = async (req, res, next) => {
  try {
    console.log('[Student Controller] getMyCourses called for userId:', req.user.id);
    
    // Get student record
    const student = await Student.findOne({ userId: req.user.id });
    if (!student) {
      console.error('[Student Controller] Student profile not found');
      return res.status(404).json({ error: 'Student profile not found' });
    }

    console.log('[Student Controller] Student found:', student.studentId, 'Dept:', student.department, 'Year:', student.year, 'Section:', student.section);

    // Get courses matching student's department, year, and section
    const courses = await Course.find({
      department: student.department,
      year: student.year,
      section: student.section,
    }).populate('teacherId', 'name email');

    console.log('[Student Controller] Found', courses.length, 'courses for student');

    res.json({ courses });
  } catch (error) {
    console.error('[Student Controller] Error in getMyCourses:', error);
    next(error);
  }
};

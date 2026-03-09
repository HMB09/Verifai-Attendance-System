import AttendanceSession from '../models/AttendanceSession.model.js';
import AttendanceRecord from '../models/AttendanceRecord.model.js';
import Course from '../models/Course.model.js';
import Enrollment from '../models/Enrollment.model.js';
import Student from '../models/Student.model.js';
import FaceEmbedding from '../models/FaceEmbedding.model.js';
import { decryptEmbedding } from '../utils/crypto.util.js';
import { FACE_RECOGNITION_THRESHOLD } from '../config/constants.js';
import { ATTENDANCE_STATUS, SESSION_STATUS, MARKING_METHOD, ROLES } from '../config/constants.js';

// Helper function to calculate cosine similarity
const cosineSimilarity = (vecA, vecB) => {
  if (vecA.length !== vecB.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

export const createSession = async (req, res, next) => {
  try {
    console.log('[Attendance Controller] createSession called');
    const { courseId } = req.body;
    const teacherId = req.user.id;
    console.log('[Attendance Controller] courseId:', courseId, 'teacherId:', teacherId);

    // Verify course exists and teacher owns it
    const course = await Course.findOne({ _id: courseId, teacherId });
    if (!course) {
      console.error('[Attendance Controller] Course not found or access denied');
      return res.status(404).json({ error: 'Course not found or access denied' });
    }
    console.log('[Attendance Controller] Course found:', course.code, course.name);

    // Check for active session
    const activeSession = await AttendanceSession.findOne({
      courseId,
      status: SESSION_STATUS.ACTIVE,
    });

    if (activeSession) {
      console.warn('[Attendance Controller] Active session already exists:', activeSession._id);
      return res.status(400).json({ error: 'Active session already exists for this course' });
    }

    console.log('[Attendance Controller] Creating new session...');
    const session = new AttendanceSession({
      courseId,
      teacherId,
      startTime: new Date(),
      status: SESSION_STATUS.ACTIVE,
    });

    await session.save();
    console.log('[Attendance Controller] Session created:', session._id);

    res.status(201).json({
      message: 'Attendance session created',
      session: {
        id: session._id,
        courseId: session.courseId,
        startTime: session.startTime,
        status: session.status,
      },
    });
  } catch (error) {
    console.error('[Attendance Controller] Error in createSession:', error);
    next(error);
  }
};

export const closeSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const teacherId = req.user.id;

    const session = await AttendanceSession.findOne({ _id: id, teacherId });
    if (!session) {
      return res.status(404).json({ error: 'Session not found or access denied' });
    }

    if (session.status === SESSION_STATUS.CLOSED) {
      return res.status(400).json({ error: 'Session is already closed' });
    }

    session.endTime = new Date();
    session.status = SESSION_STATUS.CLOSED;
    await session.save();

    res.json({
      message: 'Session closed successfully',
      session: {
        id: session._id,
        endTime: session.endTime,
        status: session.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const recognizeAndMark = async (req, res, next) => {
  try {
    console.log('\n===== FACE DATA RECEIVED FROM FRONTEND =====');
    const { sessionId, embedding } = req.body;
    console.log('[Attendance Controller] SessionId:', sessionId);
    console.log('[Attendance Controller] Face embedding length:', embedding?.length);
    console.log('[Attendance Controller] Timestamp:', new Date().toISOString());

    if (!embedding || !Array.isArray(embedding)) {
      console.error('[Attendance Controller] ❌ Invalid embedding');
      return res.status(400).json({ error: 'Valid embedding array is required' });
    }

    // Get session
    const session = await AttendanceSession.findById(sessionId);
    if (!session) {
      console.error('[Attendance Controller] Session not found:', sessionId);
      return res.status(404).json({ error: 'Session not found' });
    }
    console.log('[Attendance Controller] Session found, courseId:', session.courseId, 'status:', session.status);

    if (session.status !== SESSION_STATUS.ACTIVE) {
      console.error('[Attendance Controller] Session not active');
      return res.status(400).json({ error: 'Session is not active' });
    }

    // Get course details to find matching students
    const course = await Course.findById(session.courseId);
    if (!course) {
      console.error('[Attendance Controller] Course not found:', session.courseId);
      return res.status(404).json({ error: 'Course not found' });
    }
    console.log('[Attendance Controller] Course details - Department:', course.department, 'Year:', course.year, 'Section:', course.section);

    // Find students matching course's department, year, and section
    const matchingStudents = await Student.find({
      department: course.department,
      year: course.year,
      section: course.section,
    });
    const studentIds = matchingStudents.map((s) => s._id);
    console.log('[Attendance Controller] Found', matchingStudents.length, 'students matching course criteria');

    // Get all face embeddings for matching students
    const faceEmbeddings = await FaceEmbedding.find({
      studentId: { $in: studentIds },
    });
    console.log('[Attendance Controller] Found', faceEmbeddings.length, 'registered faces to compare');

    if (faceEmbeddings.length === 0) {
      console.warn('[Attendance Controller] ⚠️  No face embeddings found for enrolled students');
      return res.json({
        success: false,
        recognized: false,
        message: 'No registered faces found for this course',
        bestSimilarity: 0,
      });
    }

    console.log('[Attendance Controller] Starting face comparison...');
    let bestMatch = null;
    let bestSimilarity = 0;

    // Compare with each stored embedding
    for (const faceEmbedding of faceEmbeddings) {
      try {
        const storedEmbedding = decryptEmbedding(faceEmbedding.embeddingEncrypted);
        const similarity = cosineSimilarity(embedding, storedEmbedding);

        if (similarity > bestSimilarity) {
          bestSimilarity = similarity;
          bestMatch = faceEmbedding;
        }
      } catch (error) {
        console.error('[Attendance Controller] Error decrypting embedding:', error);
        continue;
      }
    }

    console.log('[Attendance Controller] Comparison complete');
    console.log('[Attendance Controller] Best similarity score:', bestSimilarity.toFixed(4));
    console.log('[Attendance Controller] Recognition threshold:', FACE_RECOGNITION_THRESHOLD);
    console.log('\n===== RECOGNITION RESULT =====');

    // Check if similarity meets threshold
    if (bestMatch && bestSimilarity >= FACE_RECOGNITION_THRESHOLD) {
      // Check if record already exists
      const existingRecord = await AttendanceRecord.findOne({
        sessionId,
        studentId: bestMatch.studentId,
      });

      if (!existingRecord) {
        // Create attendance record
        const record = new AttendanceRecord({
          sessionId,
          studentId: bestMatch.studentId,
          timestamp: new Date(),
          status: ATTENDANCE_STATUS.PRESENT,
          markedBy: MARKING_METHOD.AUTO,
        });

        await record.save();

        // Get student info for response
        const student = await Student.findById(bestMatch.studentId).populate('userId', 'name email');
        
        console.log('[Attendance Controller] ✅ STUDENT FOUND!');
        console.log('[Attendance Controller] Name:', student.userId.name);
        console.log('[Attendance Controller] Student ID:', student.studentId);
        console.log('[Attendance Controller] Similarity:', bestSimilarity.toFixed(4));
        console.log('[Attendance Controller] Attendance marked: PRESENT');
        console.log('=====================================\n');

        return res.json({
          success: true,
          recognized: true,
          student: {
            id: student._id,
            name: student.userId.name,
            studentId: student.studentId,
          },
          similarity: bestSimilarity,
          timestamp: record.timestamp,
        });
      } else {
        console.log('[Attendance Controller] ℹ️  Student already marked present');
        console.log('=====================================\n');
        return res.json({
          success: true,
          recognized: true,
          message: 'Student already marked present',
        });
      }
    } else {
      console.log('[Attendance Controller] ❌ NO STUDENT FOUND');
      console.log('[Attendance Controller] Reason: Similarity', bestSimilarity.toFixed(4), '< threshold', FACE_RECOGNITION_THRESHOLD);
      console.log('=====================================\n');
      return res.json({
        success: false,
        recognized: false,
        message: 'No matching face found',
        bestSimilarity: bestSimilarity || 0,
      });
    }
  } catch (error) {
    console.error('[Attendance Controller] Error in recognizeAndMark:', error);
    next(error);
  }
};

export const getStudentAttendance = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const { from, to } = req.query;
    const userRole = req.user.role;
    const userId = req.user.id;

    // Students can only view their own attendance
    if (userRole === ROLES.STUDENT) {
      const student = await Student.findOne({ userId });
      if (!student || student._id.toString() !== studentId) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const query = { studentId };
    if (from || to) {
      query.timestamp = {};
      if (from) query.timestamp.$gte = new Date(from);
      if (to) query.timestamp.$lte = new Date(to);
    }

    const records = await AttendanceRecord.find(query)
      .populate('sessionId', 'courseId startTime endTime')
      .populate({
        path: 'sessionId',
        populate: { path: 'courseId', select: 'code name' },
      })
      .sort({ timestamp: -1 });

    res.json({ records });
  } catch (error) {
    next(error);
  }
};

export const getCourseAttendance = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { from, to } = req.query;

    const query = {};
    if (from || to) {
      query.timestamp = {};
      if (from) query.timestamp.$gte = new Date(from);
      if (to) query.timestamp.$lte = new Date(to);
    }

    // Get all sessions for this course
    const sessions = await AttendanceSession.find({ courseId });
    const sessionIds = sessions.map((s) => s._id);

    query.sessionId = { $in: sessionIds };

    const records = await AttendanceRecord.find(query)
      .populate('studentId', 'studentId')
      .populate({
        path: 'studentId',
        populate: { path: 'userId', select: 'name email' },
      })
      .populate('sessionId', 'startTime endTime')
      .sort({ timestamp: -1 });

    res.json({ records });
  } catch (error) {
    next(error);
  }
};

export const exportAttendance = async (req, res, next) => {
  try {
    const { courseId, from, to } = req.query;

    if (!courseId) {
      return res.status(400).json({ error: 'courseId is required' });
    }

    // Get course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Get all sessions for this course
    const sessions = await AttendanceSession.find({ courseId });
    const sessionIds = sessions.map((s) => s._id);

    const query = { sessionId: { $in: sessionIds } };
    if (from || to) {
      query.timestamp = {};
      if (from) query.timestamp.$gte = new Date(from);
      if (to) query.timestamp.$lte = new Date(to);
    }

    const records = await AttendanceRecord.find(query)
      .populate('studentId', 'studentId')
      .populate({
        path: 'studentId',
        populate: { path: 'userId', select: 'name email' },
      })
      .populate('sessionId', 'startTime endTime')
      .sort({ timestamp: -1 });

    // Convert to CSV
    const csvHeader = 'Student ID,Name,Email,Date,Time,Status\n';
    const csvRows = records.map((record) => {
      const date = new Date(record.timestamp);
      return `${record.studentId.studentId},"${record.studentId.userId.name}",${record.studentId.userId.email},${date.toISOString().split('T')[0]},${date.toTimeString().split(' ')[0]},${record.status}`;
    });

    const csv = csvHeader + csvRows.join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=attendance_${course.code}_${Date.now()}.csv`);
    res.send(csv);
  } catch (error) {
    next(error);
  }
};

// Get all attendance sessions for a course with stats
export const getCourseAttendanceSessions = async (req, res, next) => {
  try {
    console.log('[Attendance Controller] getCourseAttendanceSessions called');
    const { courseId } = req.params;
    const teacherId = req.user.id;
    console.log('[Attendance Controller] courseId:', courseId, 'teacherId:', teacherId);

    // Verify course exists and teacher owns it
    const course = await Course.findOne({ _id: courseId, teacherId });
    if (!course) {
      console.error('[Attendance Controller] Course not found or access denied');
      return res.status(404).json({ error: 'Course not found or access denied' });
    }

    // Get all sessions for this course
    const sessions = await AttendanceSession.find({ courseId }).sort({ startTime: -1 });
    console.log('[Attendance Controller] Found', sessions.length, 'sessions');

    // Get course students count
    const matchingStudents = await Student.find({
      department: course.department,
      year: course.year,
      section: course.section,
    });
    const totalStudents = matchingStudents.length;
    console.log('[Attendance Controller] Total students for course:', totalStudents);

    // Get attendance stats for each session
    const sessionsWithStats = await Promise.all(
      sessions.map(async (session) => {
        const attendanceCount = await AttendanceRecord.countDocuments({
          sessionId: session._id,
          status: ATTENDANCE_STATUS.PRESENT,
        });

        return {
          id: session._id,
          date: session.startTime,
          startTime: session.startTime,
          endTime: session.endTime,
          status: session.status,
          totalStudents,
          presentCount: attendanceCount,
          absentCount: totalStudents - attendanceCount,
          attendancePercentage: totalStudents > 0 ? ((attendanceCount / totalStudents) * 100).toFixed(1) : 0,
        };
      })
    );

    console.log('[Attendance Controller] Returning', sessionsWithStats.length, 'sessions with stats');
    res.json({ sessions: sessionsWithStats, totalStudents });
  } catch (error) {
    console.error('[Attendance Controller] Error in getCourseAttendanceSessions:', error);
    next(error);
  }
};

// Get detailed attendance for a specific session
export const getSessionAttendanceDetails = async (req, res, next) => {
  try {
    console.log('[Attendance Controller] getSessionAttendanceDetails called');
    const { sessionId } = req.params;
    const teacherId = req.user.id;
    console.log('[Attendance Controller] sessionId:', sessionId, 'teacherId:', teacherId);

    // Get session
    const session = await AttendanceSession.findById(sessionId);
    if (!session) {
      console.error('[Attendance Controller] Session not found');
      return res.status(404).json({ error: 'Session not found' });
    }

    // Verify teacher owns the course
    const course = await Course.findOne({ _id: session.courseId, teacherId });
    if (!course) {
      console.error('[Attendance Controller] Access denied - not teacher\'s course');
      return res.status(403).json({ error: 'Access denied' });
    }

    console.log('[Attendance Controller] Session found for course:', course.code);

    // Get all students for this course
    const matchingStudents = await Student.find({
      department: course.department,
      year: course.year,
      section: course.section,
    }).populate('userId', 'name email');

    console.log('[Attendance Controller] Found', matchingStudents.length, 'students in course');

    // Get attendance records for this session
    const attendanceRecords = await AttendanceRecord.find({
      sessionId: session._id,
    });

    // Create a map of studentId to attendance record
    const attendanceMap = {};
    attendanceRecords.forEach((record) => {
      attendanceMap[record.studentId.toString()] = record;
    });

    // Build student list with attendance status
    const studentsWithAttendance = matchingStudents.map((student) => {
      const record = attendanceMap[student._id.toString()];
      return {
        id: student._id,
        studentId: student.studentId,
        name: student.userId.name,
        email: student.userId.email,
        department: student.department,
        year: student.year,
        section: student.section,
        status: record ? record.status : ATTENDANCE_STATUS.ABSENT,
        timestamp: record ? record.timestamp : null,
        markedBy: record ? record.markedBy : null,
      };
    });

    const presentCount = studentsWithAttendance.filter(s => s.status === ATTENDANCE_STATUS.PRESENT).length;
    const absentCount = studentsWithAttendance.filter(s => s.status === ATTENDANCE_STATUS.ABSENT).length;

    console.log('[Attendance Controller] Present:', presentCount, 'Absent:', absentCount);

    res.json({
      session: {
        id: session._id,
        courseId: session.courseId,
        courseName: course.name,
        courseCode: course.code,
        startTime: session.startTime,
        endTime: session.endTime,
        status: session.status,
      },
      students: studentsWithAttendance,
      stats: {
        total: studentsWithAttendance.length,
        present: presentCount,
        absent: absentCount,
        percentage: studentsWithAttendance.length > 0 ? ((presentCount / studentsWithAttendance.length) * 100).toFixed(1) : 0,
      },
    });
  } catch (error) {
    console.error('[Attendance Controller] Error in getSessionAttendanceDetails:', error);
    next(error);
  }
};

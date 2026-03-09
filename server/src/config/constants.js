// Face recognition threshold (0.0 to 1.0)
// Lower values = more strict matching
export const FACE_RECOGNITION_THRESHOLD = parseFloat(
  process.env.FACE_RECOGNITION_THRESHOLD || '0.6'
);

// JWT expiry time
export const JWT_EXPIRY = '1d';

// User roles
export const ROLES = {
  ADMIN: 'ADMIN',
  TEACHER: 'TEACHER',
  STUDENT: 'STUDENT',
};

// Attendance status
export const ATTENDANCE_STATUS = {
  PRESENT: 'PRESENT',
  ABSENT: 'ABSENT',
  LATE: 'LATE',
};

// Session status
export const SESSION_STATUS = {
  ACTIVE: 'ACTIVE',
  CLOSED: 'CLOSED',
};

// Marking method
export const MARKING_METHOD = {
  AUTO: 'AUTO',
  MANUAL: 'MANUAL',
};

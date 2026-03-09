import mongoose from 'mongoose';
import { ATTENDANCE_STATUS, MARKING_METHOD } from '../config/constants.js';

const attendanceRecordSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AttendanceSession',
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
    },
    status: {
      type: String,
      enum: Object.values(ATTENDANCE_STATUS),
      required: true,
      default: ATTENDANCE_STATUS.PRESENT,
    },
    markedBy: {
      type: String,
      enum: Object.values(MARKING_METHOD),
      required: true,
      default: MARKING_METHOD.AUTO,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure one record per student per session
attendanceRecordSchema.index({ sessionId: 1, studentId: 1 }, { unique: true });

export default mongoose.model('AttendanceRecord', attendanceRecordSchema);

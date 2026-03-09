import mongoose from 'mongoose';

const enrollmentSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure one enrollment per student per course
enrollmentSchema.index({ courseId: 1, studentId: 1 }, { unique: true });

export default mongoose.model('Enrollment', enrollmentSchema);

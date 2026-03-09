import mongoose from 'mongoose';

const faceEmbeddingSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      unique: true,
    },
    embeddingEncrypted: {
      type: String,
      required: true,
    },
    model: {
      type: String,
      default: 'face-api.js-resnet',
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('FaceEmbedding', faceEmbeddingSchema);

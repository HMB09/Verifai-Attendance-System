import Student from '../models/Student.model.js';
import FaceEmbedding from '../models/FaceEmbedding.model.js';
import { encryptEmbedding } from '../utils/crypto.util.js';

export const registerFace = async (req, res, next) => {
  try {
    const { embedding } = req.body;
    const userId = req.user.id;

    if (!embedding || !Array.isArray(embedding)) {
      return res.status(400).json({ error: 'Valid embedding array is required' });
    }

    // Find student record for this user
    const student = await Student.findOne({ userId });
    if (!student) {
      return res.status(404).json({ error: 'Student record not found' });
    }

    // Encrypt embedding
    const encryptedEmbedding = encryptEmbedding(embedding);

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

    res.json({
      message: 'Face embedding registered successfully',
      faceEmbeddingId: faceEmbedding._id,
    });
  } catch (error) {
    next(error);
  }
};

export const getFaceStatus = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Find student record for this user
    const student = await Student.findOne({ userId });
    if (!student) {
      return res.status(404).json({ error: 'Student record not found' });
    }

    // Check if face embedding exists
    const faceEmbedding = await FaceEmbedding.findOne({ studentId: student._id });

    res.json({
      registered: !!faceEmbedding,
      registeredAt: faceEmbedding?.createdAt || null,
      model: faceEmbedding?.model || null,
    });
  } catch (error) {
    next(error);
  }
};

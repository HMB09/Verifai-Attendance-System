import jwt from 'jsonwebtoken';
import { JWT_EXPIRY } from '../config/constants.js';

/**
 * Generate JWT token for user
 * @param {Object} payload - User data to encode
 * @returns {string} - JWT token
 */
export const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: JWT_EXPIRY,
  });
};

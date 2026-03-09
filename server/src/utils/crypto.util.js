import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits

/**
 * Get encryption key from environment variable
 * Key should be base64 encoded 32-byte (256-bit) key
 */
const getKey = () => {
  const key = process.env.EMBEDDING_AES_KEY;
  if (!key) {
    throw new Error('EMBEDDING_AES_KEY environment variable is not set');
  }
  // If key is base64, decode it; otherwise use it directly
  try {
    return Buffer.from(key, 'base64');
  } catch {
    return Buffer.from(key, 'utf8').slice(0, KEY_LENGTH);
  }
};

/**
 * Encrypt a face embedding array
 * @param {number[]} embedding - Array of numbers representing face embedding
 * @returns {string} - Base64 encoded string containing IV, authTag, and ciphertext
 */
export const encryptEmbedding = (embedding) => {
  try {
    const key = getKey();
    const iv = crypto.randomBytes(16); // 128-bit IV for GCM
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    // Convert embedding array to JSON string, then to buffer
    const plaintext = JSON.stringify(embedding);
    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);

    const authTag = cipher.getAuthTag();

    // Combine IV, authTag, and ciphertext, then base64 encode
    const combined = Buffer.concat([iv, authTag, encrypted]);
    return combined.toString('base64');
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt embedding');
  }
};

/**
 * Decrypt a face embedding
 * @param {string} encryptedData - Base64 encoded string from encryptEmbedding
 * @returns {number[]} - Original embedding array
 */
export const decryptEmbedding = (encryptedData) => {
  try {
    const key = getKey();
    const combined = Buffer.from(encryptedData, 'base64');

    // Extract IV (16 bytes), authTag (16 bytes), and ciphertext (rest)
    const iv = combined.slice(0, 16);
    const authTag = combined.slice(16, 32);
    const ciphertext = combined.slice(32);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);

    return JSON.parse(decrypted.toString('utf8'));
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt embedding');
  }
};

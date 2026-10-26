const crypto = require('crypto');
const fs = require('fs');

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;
const SALT = 'secure-cloud-salt-key-file-enc';

function getEncryptionKey() {
  const secret = process.env.FILE_ENCRYPTION_SECRET || process.env.JWT_SECRET || 'secure-cloud-default-secret-key-32b';
  return crypto.scryptSync(secret, SALT, 32);
}

/**
 * Encrypts a file on disk in-place.
 * @param {string} filePath - Absolute path to the file.
 */
function encryptFileInPlace(filePath) {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const fileData = fs.readFileSync(filePath);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(fileData), cipher.final()]);

  // Store IV prepended to the encrypted content
  const combined = Buffer.concat([iv, encrypted]);
  fs.writeFileSync(filePath, combined);
}

/**
 * Decrypts an encrypted file and returns the decrypted Buffer.
 * If file is not encrypted or decryption fails, falls back gracefully.
 * @param {string} filePath - Absolute path to the file.
 * @returns {Buffer}
 */
function decryptFileToBuffer(filePath) {
  const key = getEncryptionKey();
  const rawData = fs.readFileSync(filePath);

  if (rawData.length <= IV_LENGTH) {
    return rawData;
  }

  try {
    const iv = rawData.subarray(0, IV_LENGTH);
    const encryptedData = rawData.subarray(IV_LENGTH);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    const decrypted = Buffer.concat([decipher.update(encryptedData), decipher.final()]);
    return decrypted;
  } catch (err) {
    // If decryption fails (e.g. if file wasn't encrypted), return original data
    console.warn(`Decryption notice for ${filePath}: ${err.message}. Returning raw buffer.`);
    return rawData;
  }
}

module.exports = {
  encryptFileInPlace,
  decryptFileToBuffer
};

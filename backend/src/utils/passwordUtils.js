import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

/**
 * Hashes a plain-text password.
 * @param {string} password
 * @returns {Promise<string>} bcrypt hash
 */
export const hashPassword = async (password) => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * Compares a plain-text password against a bcrypt hash.
 * @param {string} password
 * @param {string} hash
 * @returns {Promise<boolean>}
 */
export const comparePassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};

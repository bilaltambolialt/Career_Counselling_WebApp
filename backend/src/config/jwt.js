import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.JWT_SECRET) {
  throw new Error('Missing JWT_SECRET in environment');
}

/**
 * Signs a JWT with role + tenantId claims.
 * @param {{ userId, role, tenantId, email }} payload
 * @returns {string} signed JWT
 */
export const signToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

/**
 * Verifies a JWT and returns decoded payload.
 * Throws if invalid or expired.
 * @param {string} token
 * @returns {{ userId, role, tenantId, email, iat, exp }}
 */
export const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

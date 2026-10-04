import { verifyToken } from '../config/jwt.js';
import { sendError } from '../utils/responseUtils.js';

/**
 * Validates JWT from Authorization header.
 * Attaches { userId, role, tenantId, email } to req.user.
 */
export const validateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 'Authentication required', 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyToken(token);
    req.user = {
      userId: decoded.userId,
      role: decoded.role,
      tenantId: decoded.tenantId ?? null,
      email: decoded.email,
    };
    next();
  } catch {
    return sendError(res, 'Invalid or expired token', 401);
  }
};

/**
 * Role guard middleware — restricts route to specific roles.
 * Usage: requireRole('admin', 'super_admin')
 */
export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return sendError(res, 'Access forbidden — insufficient permissions', 403);
  }
  next();
};

/**
 * Ensures tenant context is present for tenant-scoped routes.
 * Super admins bypass this (they have no tenantId).
 */
export const requireTenant = (req, res, next) => {
  if (req.user.role !== 'super_admin' && !req.user.tenantId) {
    return sendError(res, 'Tenant context missing', 403);
  }
  next();
};

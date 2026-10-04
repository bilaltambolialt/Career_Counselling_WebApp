/**
 * Standard API response helpers.
 * Envelope: { success, data, meta?, message, error }
 *
 * meta is optional — used for paginated list responses.
 */

export const sendSuccess = (res, data = null, message = 'Success', statusCode = 200, meta = null) => {
  const body = { success: true, data, message, error: null };
  if (meta !== null) body.meta = meta;
  return res.status(statusCode).json(body);
};

export const sendError = (res, message = 'An error occurred', statusCode = 500, error = null) => {
  return res.status(statusCode).json({
    success: false,
    data: null,
    message,
    error: process.env.NODE_ENV === 'development' ? error : null,
  });
};

export const sendCreated = (res, data = null, message = 'Created successfully') => {
  return sendSuccess(res, data, message, 201);
};

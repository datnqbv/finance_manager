/**
 * asyncHandler - Wrapper utility to eliminate repetitive try-catch blocks
 * in controller handlers, forwarding any thrown exceptions to the
 * central Express error handling middleware.
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

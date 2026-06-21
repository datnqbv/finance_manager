export const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log to console for dev
  console.error('Error:', err);

  // Bad ObjectId / cast error
  if (err.name === 'CastError') {
    const message = 'Không tìm thấy tài nguyên';
    error = { message, statusCode: 404 };
  }

  // Duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field === 'email' ? 'Email' : field} đã tồn tại`;
    error = { message, statusCode: 400 };
  }

  // Validation error (DB or ORM)
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = { message, statusCode: 400 };
  }

  res.status(err.statusCode || error.statusCode || 500).json({
    success: false,
    message: error.message || 'Lỗi server',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

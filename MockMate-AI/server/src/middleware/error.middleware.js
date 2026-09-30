const errorMiddleware = (error, _req, res, _next) => {
  const statusCode = error.statusCode || 500;
  console.error('API error:', error.message);
  res.status(statusCode).json({
    success: false,
    message: error.message || 'Something went wrong.',
  });
};

export default errorMiddleware;

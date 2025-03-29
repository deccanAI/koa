const { AppError } = require('../utils/errorUtils');

const isDev = process.env.NODE_ENV !== 'production';

const formatError = (err) => {
  const response = {
    status: err.status || 'error',
    message: err.message,
    requestId: err.requestId,
    timestamp: new Date().toISOString()
  };

  if (isDev) {
    response.stack = err.stack;
    if (err.details) {
      response.details = err.details;
    }
  }

  if (err.code === 'ETIMEDOUT') {
    response.status = 'error';
    response.statusCode = 408;
    response.message = 'Request timeout';
  }

  if (err.code === 'ECONNABORTED') {
    response.status = 'error';
    response.statusCode = 503;
    response.message = 'Service unavailable';
  }

  return response;
};

const errorHandler = async (ctx, next) => {
  try {
    ctx.state.requestId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    
    const timeout = setTimeout(() => {
      const timeoutError = new AppError('Request timeout', 408);
      timeoutError.code = 'ETIMEDOUT';
      throw timeoutError;
    }, 30000);

    try {
      await next();
    } finally {
      clearTimeout(timeout);
    }
  } catch (err) {
    const error = err instanceof AppError ? err : new AppError(err.message);
    error.requestId = ctx.state.requestId;

    if (error instanceof Error && error.name === 'UnauthorizedError') {
      error.statusCode = 401;
    }

    ctx.status = error.statusCode || 500;
    ctx.body = formatError(error);

    if (ctx.status >= 500) {
      ctx.app.emit('error', error, ctx);
    }
  }
};

module.exports = errorHandler;
module.exports.formatError = formatError;
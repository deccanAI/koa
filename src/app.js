const Koa = require('koa');
const errorHandler = require('./middleware/errorHandler');
const { formatError } = require('./middleware/errorHandler');
const { ValidationError, NotFoundError } = require('./utils/errorUtils');

const app = new Koa();

// Make error handler available for testing
app.context.errorHandler = { formatError };

// Apply error handling middleware
app.use(errorHandler);

// Example route that throws a validation error
app.use(async (ctx, next) => {
  if (ctx.path === '/validate') {
    throw new ValidationError('Invalid input', { field: 'username', message: 'Required' });
  }
  await next();
});

// Example route that throws a not found error
app.use(async (ctx, next) => {
  if (ctx.path === '/not-found') {
    throw new NotFoundError('Resource not found');
  }
  await next();
});

// Example route that throws an unexpected error
app.use(async (ctx, next) => {
  if (ctx.path === '/error') {
    throw new Error('Unexpected server error');
  }
  await next();
});

// Default route
app.use(async (ctx) => {
  ctx.body = { message: 'Hello World' };
});

// Error event listener for logging
app.on('error', (err, ctx) => {
  console.error('Server Error:', {
    message: err.message,
    stack: err.stack,
    requestId: ctx.state.requestId,
    url: ctx.url
  });
});

module.exports = app;
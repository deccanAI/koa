class MiddlewareError extends Error {
  constructor(message, originalError, middleware) {
    super(message);
    this.name = 'MiddlewareError';
    this.originalError = originalError;
    this.middleware = middleware;
  }
}

function isAsync(fn) {
  return fn.constructor.name === 'AsyncFunction' || fn.constructor.name === 'GeneratorFunction';
}

function validateMiddleware(fn) {
  if (typeof fn !== 'function') {
    throw new TypeError('Middleware must be a function');
  }
  if (!isAsync(fn)) {
    console.warn('Warning: Middleware should be async function');
  }
}

function compose(middleware) {
  if (!Array.isArray(middleware)) {
    throw new TypeError('Middleware stack must be an array');
  }

  middleware.forEach(validateMiddleware);

  return async function(context, next) {
    let index = -1;
    
    async function dispatch(i) {
      if (i <= index) {
        throw new Error('next() called multiple times');
      }
      
      index = i;
      let fn = middleware[i];
      
      if (i === middleware.length) {
        fn = next;
      }
      
      if (!fn) return;
      
      try {
        return await fn(context, dispatch.bind(null, i + 1));
      } catch (err) {
        throw new MiddlewareError(
          `Error in middleware ${fn.name || 'anonymous'}`,
          err,
          fn
        );
      }
    }

    return dispatch(0);
  };
}

module.exports = { compose, MiddlewareError };
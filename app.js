const Koa = require('koa');
const EnhancedRequest = require('./enhanced-request');
const { compose } = require('./enhanced-compose');

class EnhancedKoa extends Koa {
  constructor(options = {}) {
    super(options);
    this.enhancedMiddleware = true;
  }

  createContext(req, res) {
    const context = super.createContext(req, res);
    context.enhancedRequest = new EnhancedRequest(req);
    return context;
  }

  use(fn) {
    if (typeof fn !== 'function') {
      throw new TypeError('Middleware must be a function!');
    }
    this.middleware.push(fn);
    return this;
  }

  callback() {
    const fn = compose(this.middleware);

    if (!this.listenerCount('error')) {
      this.on('error', this.onerror);
    }

    return (req, res) => {
      const ctx = this.createContext(req, res);
      return this.handleRequest(ctx, fn);
    };
  }

  async handleRequest(ctx, fnMiddleware) {
    const onerror = err => ctx.onerror(err);
    const handleResponse = () => respond(ctx);
    
    try {
      await fnMiddleware(ctx);
      return handleResponse();
    } catch (err) {
      onerror(err);
    }
  }
}

function respond(ctx) {
  if (ctx.respond === false) return;

  if (!ctx.writable) return;

  const res = ctx.res;
  let body = ctx.body;
  const code = ctx.status;

  if (code === 204 || code === 304) {
    res.end();
    return;
  }

  if (body === null || body === undefined) {
    res.end();
    return;
  }

  if (Buffer.isBuffer(body)) {
    res.end(body);
    return;
  }

  if (typeof body === 'string') {
    res.end(body);
    return;
  }

  if (body instanceof Stream) {
    body.pipe(res);
    return;
  }

  body = JSON.stringify(body);
  res.end(body);
}

module.exports = EnhancedKoa;
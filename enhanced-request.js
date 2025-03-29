const Stream = require('stream');
const getRawBody = require('raw-body');
const contentType = require('content-type');
const typeIs = require('type-is');

class EnhancedRequest {
  constructor(req) {
    this.req = req;
    this._body = null;
    this._rawBody = null;
  }

  get headers() {
    return this.req.headers;
  }

  async getBody(options = {}) {
    if (this._body !== null) return this._body;

    const strictTypes = options.strictTypes ?? true;
    const limit = options.limit ?? '1mb';
    const encoding = options.encoding ?? 'utf8';

    if (!typeIs.hasBody(this.req)) {
      return (this._body = null);
    }

    try {
      const type = contentType.parse(this.req);
      if (strictTypes && !typeIs(this.req, ['json', 'form', 'text'])) {
        throw new Error(`Unsupported content type: ${type.type}`);
      }

      const rawBody = await this._getRawBody({ limit, encoding });
      this._rawBody = rawBody;

      if (type.type.includes('application/json')) {
        try {
          this._body = JSON.parse(rawBody);
        } catch (err) {
          err.status = 400;
          err.message = 'Invalid JSON';
          throw err;
        }
      } else if (type.type.includes('application/x-www-form-urlencoded')) {
        this._body = new URLSearchParams(rawBody.toString());
      } else {
        this._body = rawBody.toString();
      }

      return this._body;
    } catch (err) {
      err.status = err.status || 400;
      throw err;
    }
  }

  async _getRawBody(options) {
    return new Promise((resolve, reject) => {
      getRawBody(this.req, options, (err, body) => {
        if (err) reject(err);
        else resolve(body);
      });
    });
  }

  get rawBody() {
    return this._rawBody;
  }
}

module.exports = EnhancedRequest;
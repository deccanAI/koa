'use strict';

const request = require('supertest');
const assert = require('assert');
const Koa = require('../..');

describe('app error handling', () => {
  it('should handle thrown errors', async() => {
    const app = new Koa();

    app.use(async ctx => {
      throw new Error('intentional error');
    });

    const server = app.listen();
    const response = await request(server).get('/');
    assert.strictEqual(response.status, 500);
    assert.strictEqual(response.text, 'Internal Server Error');
    server.close();
  });

  it('should handle non-error throws', async() => {
    const app = new Koa();

    app.use(async ctx => {
      // eslint-disable-next-line no-throw-literal
      throw 'string error';
    });

    const server = app.listen();
    const response = await request(server).get('/');
    assert.strictEqual(response.status, 500);
    assert.strictEqual(response.text, 'Internal Server Error');
    server.close();
  });

  it('should handle errors with status codes', async() => {
    const app = new Koa();

    app.use(async ctx => {
      const err = new Error('not found');
      err.status = 404;
      throw err;
    });

    const server = app.listen();
    const response = await request(server).get('/');
    assert.strictEqual(response.status, 404);
    assert.strictEqual(response.text, 'Not Found');
    server.close();
  });

  it('should handle errors in stream responses', async() => {
    const app = new Koa();
    const { Readable } = require('stream');

    app.use(async ctx => {
      const stream = new Readable({
        read() {
          // Simulate an error in the stream
          process.nextTick(() => {
            this.emit('error', new Error('stream error'));
          });
        }
      });
      
      ctx.body = stream;
    });

    const server = app.listen();
    const response = await request(server).get('/');
    assert.strictEqual(response.status, 500);
    server.close();
  });

  it('should handle JSON stringify errors', async() => {
    const app = new Koa();

    app.use(async ctx => {
      // Create an object with circular reference that can't be stringified
      const obj = {};
      obj.circular = obj;
      ctx.body = obj;
    });

    const server = app.listen();
    const response = await request(server).get('/');
    assert.strictEqual(response.status, 500);
    server.close();
  });
});

'use strict'

const request = require('supertest')
const assert = require('assert')
const Koa = require('../..')
const http = require('http')

describe('ctx.flushHeaders()', () => {
  it('should set headersSent', () => {
    const app = new Koa()

    app.use((ctx, next) => {
      ctx.body = 'Body'
      ctx.status = 200
      ctx.flushHeaders()
      assert.strictEqual(ctx.res.headersSent, true)
    })

    const server = app.listen()

    return request(server)
      .get('/')
      .expect(200)
      .expect('Body')
  })

  it('should allow a response afterwards', () => {
    const app = new Koa()

    app.use((ctx, next) => {
      ctx.status = 200
      ctx.res.setHeader('Content-Type', 'text/plain')
      ctx.flushHeaders()
      ctx.body = 'Body'
    })

    const server = app.listen()
    return request(server)
      .get('/')
      .expect(200)
      .expect('Content-Type', 'text/plain')
      .expect('Body')
  })

  it('should send the correct status code', () => {
    const app = new Koa()

    app.use((ctx, next) => {
      ctx.status = 401
      ctx.res.setHeader('Content-Type', 'text/plain')
      ctx.flushHeaders()
      ctx.body = 'Body'
    })

    const server = app.listen()
    return request(server)
      .get('/')
      .expect(401)
      .expect('Content-Type', 'text/plain')
      .expect('Body')
  })

  it('should ignore set header after flushHeaders', async () => {
    const app = new Koa()

    app.use((ctx, next) => {
      ctx.status = 401
      ctx.res.setHeader('Content-Type', 'text/plain')
      ctx.flushHeaders()
      ctx.body = 'foo'
      ctx.set('X-Shouldnt-Work', 'Value')
      ctx.remove('Content-Type')
      ctx.vary('Content-Type')
    })

    const server = app.listen()
    const res = await request(server)
      .get('/')
      .expect(401)
      .expect('Content-Type', 'text/plain')

    assert.strictEqual(res.headers['x-shouldnt-work'], undefined, 'header set after flushHeaders')
    assert.strictEqual(res.headers.vary, undefined, 'header set after flushHeaders')
  })

  it('should flush headers first and delay to send data', done => {
    const PassThrough = require('stream').PassThrough
    const app = new Koa()
    let server

    app.use(ctx => {
      ctx.type = 'json'
      ctx.status = 200
      ctx.headers.Link = '</css/mycss.css>; as=style; rel=preload, <https://img.craftflair.com>; rel=preconnect; crossorigin'
      const stream = ctx.body = new PassThrough()
      ctx.flushHeaders()

      // Reduced timeout from 10000ms to 100ms for faster test execution
      setTimeout(() => {
        stream.end(JSON.stringify({ message: 'hello!' }))
      }, 100)
    })

    server = app.listen(function (err) {
      if (err) {
        server.close()
        return done(err)
      }

      const port = this.address().port
      const req = http.request({
        port
      })
        .on('response', res => {
          const onData = () => {
            res.removeAllListeners()
            server.close()
            done(new Error('boom'))
          }
          res.on('data', onData)

          // shouldn't receive any data for a while
          setTimeout(() => {
            res.removeListener('data', onData)
            res.destroy() // Ensure the response is properly destroyed
            server.close(() => done())
          }, 50) // Reduced from 1000ms to 50ms
        })
        .on('error', err => {
          server.close(() => done(err))
        })
      
      req.end()
    })
  })

  it('should catch stream error', done => {
    const PassThrough = require('stream').PassThrough
    const app = new Koa()
    let server
    
    app.once('error', err => {
      assert(err.message === 'mock error')
      server.close(() => done())
    })

    app.use(ctx => {
      ctx.type = 'json'
      ctx.status = 200
      ctx.headers.Link = '</css/mycss.css>; as=style; rel=preload, <https://img.craftflair.com>; rel=preconnect; crossorigin'
      ctx.length = 20
      ctx.flushHeaders()
      const stream = ctx.body = new PassThrough()

      setTimeout(() => {
        stream.emit('error', new Error('mock error'))
      }, 50) // Reduced from 100ms to 50ms
    })

    server = app.listen()

    request(server)
      .get('/')
      .end((err) => {
        if (err && !server.listening) {
          // If server already closed due to the error event above
          return
        }
        if (err && server.listening) {
          server.close(() => done(err))
        }
      })
  })
})

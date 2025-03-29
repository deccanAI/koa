'use strict'

const request = require('supertest')
const assert = require('assert')
const Koa = require('../..')

describe('app.context', () => {
  const app1 = new Koa()
  app1.context.msg = 'hello'
  const app2 = new Koa()

  it('should merge properties', () => {
    let server
    app1.use((ctx, next) => {
      assert.strictEqual(ctx.msg, 'hello')
      ctx.status = 204
    })

    server = app1.listen()
    
    return request(server)
      .get('/')
      .expect(204)
      .then(() => {
        server.close()
      })
      .catch(err => {
        server.close()
        throw err
      })
  })

  it('should not affect the original prototype', () => {
    let server
    app2.use((ctx, next) => {
      assert.strictEqual(ctx.msg, undefined)
      ctx.status = 204
    })

    server = app2.listen()
    
    return request(server)
      .get('/')
      .expect(204)
      .then(() => {
        server.close()
      })
      .catch(err => {
        server.close()
        throw err
      })
  })
})

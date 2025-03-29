'use strict'

const request = require('supertest')
const assert = require('assert')
const Koa = require('../..')

describe('ctx.state', () => {
  it('should provide a ctx.state namespace', () => {
    const app = new Koa()
    let server

    app.use(ctx => {
      assert.deepStrictEqual(ctx.state, {})
    })

    server = app.listen()

    return request(server)
      .get('/')
      .expect(404)
      .then(() => {
        server.close()
      })
      .catch(err => {
        server.close()
        throw err
      })
  })
})

'use strict'

const assert = require('assert')
const Koa = require('../..')
const request = require('supertest')

describe('res.back', () => {
  it('should redirect to Referrer', async () => {
    const app = new Koa()

    app.use(ctx => {
      ctx.redirect('back')
    })

    const server = app.listen()

    const res = await request(server)
      .get('/')
      .set('Referrer', '/login')

    assert.strictEqual(res.status, 302)
    assert.strictEqual(res.headers.location, '/login')
  })

  it('should redirect to fallback if no Referrer exists', async () => {
    const app = new Koa()

    app.use(ctx => {
      ctx.redirect('back', '/index.html')
    })

    const server = app.listen()

    const res = await request(server)
      .get('/')

    assert.strictEqual(res.status, 302)
    assert.strictEqual(res.headers.location, '/index.html')
  })

  it('should redirect to / if no Referrer and no fallback exists', async () => {
    const app = new Koa()

    app.use(ctx => {
      ctx.redirect('back')
    })

    const server = app.listen()

    const res = await request(server)
      .get('/')

    assert.strictEqual(res.status, 302)
    assert.strictEqual(res.headers.location, '/')
  })
})

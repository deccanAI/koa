'use strict'

const assert = require('assert')
const context = require('../../test-helpers/context')

describe('ctx.query', () => {
  describe('when missing', () => {
    it('should return an empty object', () => {
      const ctx = context({ url: '/' })
      assert(!Object.keys(ctx.query).length)
    })

    it('should return the same object each time it\'s accessed', () => {
      const ctx = context({ url: '/' })
      ctx.query.a = '2'
      assert.strictEqual(ctx.query.a, '2')
    })
  })

  it('should return a parsed query string', () => {
    const ctx = context({ url: '/?page=2' })
    assert.strictEqual(ctx.query.page, '2')
  })

  it('should handle array parameters', () => {
    const ctx = context({ url: '/?colors=red&colors=blue' })
    assert.deepStrictEqual(ctx.query.colors, ['red', 'blue'])
  })

  it('should handle mixed single and array parameters', () => {
    const ctx = context({ url: '/?page=2&colors=red&colors=blue' })
    assert.strictEqual(ctx.query.page, '2')
    assert.deepStrictEqual(ctx.query.colors, ['red', 'blue'])
  })

  it('should handle empty values', () => {
    const ctx = context({ url: '/?empty=&exists=value' })
    assert.strictEqual(ctx.query.empty, '')
    assert.strictEqual(ctx.query.exists, 'value')
  })

  it('should handle special characters', () => {
    const ctx = context({ url: '/?q=hello+world&special=%40%23%24' })
    assert.strictEqual(ctx.query.q, 'hello world')
    assert.strictEqual(ctx.query.special, '@#$')
  })
})

describe('ctx.query=', () => {
  it('should stringify and replace the query string and search', () => {
    const ctx = context({ url: '/store/shoes' })
    ctx.query = { page: 2, color: 'blue' }
    assert.strictEqual(ctx.url, '/store/shoes?page=2&color=blue')
    assert.strictEqual(ctx.querystring, 'page=2&color=blue')
    assert.strictEqual(ctx.search, '?page=2&color=blue')
  })

  it('should change .url but not .originalUrl', () => {
    const ctx = context({ url: '/store/shoes' })
    ctx.query = { page: 2 }
    assert.strictEqual(ctx.url, '/store/shoes?page=2')
    assert.strictEqual(ctx.originalUrl, '/store/shoes')
    assert.strictEqual(ctx.request.originalUrl, '/store/shoes')
  })

  it('should handle array values', () => {
    const ctx = context({ url: '/store/shoes' })
    ctx.query = { colors: ['red', 'blue'] }
    assert.strictEqual(ctx.url, '/store/shoes?colors=red&colors=blue')
    assert.strictEqual(ctx.querystring, 'colors=red&colors=blue')
    assert.deepStrictEqual(ctx.query.colors, ['red', 'blue'])
  })

  it('should handle mixed single and array values', () => {
    const ctx = context({ url: '/store/shoes' })
    ctx.query = { page: 2, colors: ['red', 'blue'] }
    assert.strictEqual(ctx.url, '/store/shoes?page=2&colors=red&colors=blue')
    assert.strictEqual(ctx.querystring, 'page=2&colors=red&colors=blue')
    assert.strictEqual(ctx.query.page, '2')
    assert.deepStrictEqual(ctx.query.colors, ['red', 'blue'])
  })

  it('should handle special characters', () => {
    const ctx = context({ url: '/store/shoes' })
    ctx.query = { q: 'hello world', special: '@#$' }
    assert.strictEqual(ctx.url, '/store/shoes?q=hello+world&special=%40%23%24')
    assert.strictEqual(ctx.querystring, 'q=hello+world&special=%40%23%24')
    assert.strictEqual(ctx.query.q, 'hello world')
    assert.strictEqual(ctx.query.special, '@#$')
  })

  it('should ignore undefined values', () => {
    const ctx = context({ url: '/store/shoes' })
    ctx.query = { a: 1, b: undefined, c: 3 }
    assert.strictEqual(ctx.url, '/store/shoes?a=1&c=3')
    assert.strictEqual(ctx.querystring, 'a=1&c=3')
    assert.strictEqual(ctx.query.a, '1')
    assert.strictEqual(ctx.query.c, '3')
    assert.strictEqual(ctx.query.b, undefined)
  })
})

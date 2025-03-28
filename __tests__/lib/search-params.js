'use strict'

const assert = require('assert')
const searchParams = require('../../lib/search-params')

describe('search-params', () => {
  describe('parse()', () => {
    it('should parse a query string into an object', () => {
      const obj = searchParams.parse('foo=bar&baz=qux')
      assert.deepStrictEqual(obj, { foo: 'bar', baz: 'qux' })
    })

    it('should handle empty query strings', () => {
      assert.deepStrictEqual(searchParams.parse(''), {})
      assert.deepStrictEqual(searchParams.parse(null), {})
      assert.deepStrictEqual(searchParams.parse(undefined), {})
    })

    it('should handle multiple values for the same key', () => {
      const obj = searchParams.parse('foo=bar&foo=baz')
      assert.deepStrictEqual(obj, { foo: ['bar', 'baz'] })
    })

    it('should handle special characters', () => {
      const obj = searchParams.parse('foo=bar%20baz&qux=quux+quuz')
      assert.deepStrictEqual(obj, { foo: 'bar baz', qux: 'quux quuz' })
    })

    it('should handle keys without values', () => {
      const obj = searchParams.parse('foo&bar=')
      assert.deepStrictEqual(obj, { foo: '', bar: '' })
    })
  })

  describe('stringify()', () => {
    it('should stringify an object into a query string', () => {
      const str = searchParams.stringify({ foo: 'bar', baz: 'qux' })
      assert.strictEqual(str, 'foo=bar&baz=qux')
    })

    it('should handle empty objects', () => {
      assert.strictEqual(searchParams.stringify({}), '')
      assert.strictEqual(searchParams.stringify(null), '')
      assert.strictEqual(searchParams.stringify(undefined), '')
    })

    it('should handle arrays', () => {
      const str = searchParams.stringify({ foo: ['bar', 'baz'] })
      assert.strictEqual(str, 'foo=bar&foo=baz')
    })

    it('should handle special characters', () => {
      const str = searchParams.stringify({ foo: 'bar baz', qux: 'quux quuz' })
      assert.strictEqual(str, 'foo=bar+baz&qux=quux+quuz')
    })

    it('should handle undefined and null values', () => {
      const str = searchParams.stringify({ foo: undefined, bar: null, baz: 'qux' })
      assert.strictEqual(str, 'bar=null&baz=qux')
    })
  })
})

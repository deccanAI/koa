'use strict'

/**
 * Parse a query string into an object.
 * Uses URLSearchParams internally but maintains
 * compatibility with the previous querystring implementation.
 *
 * @param {String} str
 * @return {Object}
 * @api public
 */
exports.parse = function(str) {
  if (!str) return {}
  
  const searchParams = new URLSearchParams(str)
  const result = {}
  
  // Convert URLSearchParams to a plain object
  // Handle multiple values for the same key by joining them with commas
  for (const [key, value] of searchParams) {
    // If the key already exists, convert to array or append to existing array
    if (key in result) {
      if (!Array.isArray(result[key])) {
        result[key] = [result[key]]
      }
      result[key].push(value)
    } else {
      result[key] = value
    }
  }
  
  return result
}

/**
 * Stringify an object into a query string.
 * Uses URLSearchParams internally but maintains
 * compatibility with the previous querystring implementation.
 *
 * @param {Object} obj
 * @return {String}
 * @api public
 */
exports.stringify = function(obj) {
  if (!obj) return ''
  
  const params = new URLSearchParams()
  
  // Add each key-value pair to the URLSearchParams object
  // Handle arrays by adding multiple entries with the same key
  for (const key in obj) {
    const value = obj[key]
    if (Array.isArray(value)) {
      for (const item of value) {
        params.append(key, item)
      }
    } else if (value !== undefined) {
      params.append(key, value)
    }
  }
  
  return params.toString()
}

'use strict';

/**
 * Error normalization utilities for Koa
 */

const util = require('util');
const statuses = require('statuses');
const { HttpError } = require('http-errors');

/**
 * Normalize an error to ensure consistent properties
 * 
 * @param {Error|any} err - The error to normalize
 * @param {Object} [options] - Options for normalization
 * @param {number} [options.status] - Default status code
 * @param {boolean} [options.expose] - Whether to expose error details
 * @return {Error} Normalized error
 * @api public
 */
exports.normalizeError = function(err, options = {}) {
  // Convert non-error objects to Error instances
  if (!(err instanceof Error)) {
    const originalValue = err;
    err = new Error(typeof err === 'string' ? err : util.format('non-error thrown: %j', err));
    err.originalValue = originalValue;
  }

  // Set status code
  if (!err.status && !err.statusCode) {
    err.status = options.status || 500;
  } else if (!err.status) {
    err.status = err.statusCode;
  }

  // Set error message based on status code if not provided
  if (!err.message && err.status) {
    err.message = statuses.message[err.status] || String(err.status);
  }

  // Determine if error details should be exposed
  if (options.expose !== undefined) {
    err.expose = options.expose;
  } else if (err.expose === undefined) {
    // Only expose error details for client errors (4xx)
    err.expose = err.status < 500;
  }

  return err;
};

/**
 * Create a formatted error object with consistent properties
 * 
 * @param {string|number} status - HTTP status code or message
 * @param {string} [message] - Error message
 * @param {Object} [properties] - Additional properties to add to the error
 * @return {Error} Formatted error
 * @api public
 */
exports.createError = function(status, message, properties) {
  // Allow status to be first arg
  if (typeof status !== 'number' && !message) {
    message = status;
    status = 500;
  }

  // Set default message based on status code
  if (!message) {
    message = statuses.message[status] || String(status);
  }

  // Create error instance
  const err = new HttpError(message);
  err.status = status;

  // Add additional properties
  if (properties) {
    Object.assign(err, properties);
  }

  return err;
};

/**
 * Export HttpError for convenience
 */
exports.HttpError = HttpError;

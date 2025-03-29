const request = require('supertest');
const app = require('../src/app');
const { AppError } = require('../src/utils/errorUtils');

describe('Error Handling', () => {
  const server = app.listen();

  afterAll(() => {
    server.close();
  });

  test('should handle validation errors', async () => {
    const response = await request(server)
      .get('/validate')
      .expect(400);

    expect(response.body).toMatchObject({
      status: 'fail',
      message: 'Invalid input',
      details: { field: 'username', message: 'Required' }
    });
    expect(response.body.requestId).toBeDefined();
  });

  test('should handle not found errors', async () => {
    const response = await request(server)
      .get('/not-found')
      .expect(404);

    expect(response.body).toMatchObject({
      status: 'fail',
      message: 'Resource not found'
    });
    expect(response.body.requestId).toBeDefined();
  });

  test('should handle unexpected errors', async () => {
    const response = await request(server)
      .get('/error')
      .expect(500);

    expect(response.body).toMatchObject({
      status: 'error',
      message: 'Unexpected server error'
    });
    expect(response.body.requestId).toBeDefined();
    expect(response.body.stack).toBeDefined();
  });

  test('should handle successful requests', async () => {
    const response = await request(server)
      .get('/')
      .expect(200);

    expect(response.body).toEqual({
      message: 'Hello World'
    });
  });

  test('should include timestamp in error response', async () => {
    const response = await request(server)
      .get('/error')
      .expect(500);

    expect(response.body.timestamp).toBeDefined();
    expect(new Date(response.body.timestamp).getTime()).not.toBeNaN();
  });

  test('should handle timeout errors', async () => {
    const error = new AppError('Request timeout', 408);
    error.code = 'ETIMEDOUT';
    
    const formattedError = app.context.errorHandler.formatError(error);
    expect(formattedError.statusCode).toBe(408);
    expect(formattedError.message).toBe('Request timeout');
  });

  test('should handle connection errors', async () => {
    const error = new AppError('Service unavailable', 503);
    error.code = 'ECONNABORTED';
    
    const formattedError = app.context.errorHandler.formatError(error);
    expect(formattedError.statusCode).toBe(503);
    expect(formattedError.message).toBe('Service unavailable');
  });
});
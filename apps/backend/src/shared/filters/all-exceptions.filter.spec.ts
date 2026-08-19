import { BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { AllExceptionsFilter } from './all-exceptions.filter';

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let response: any;
  let host: any;

  beforeEach(() => {
    filter = new AllExceptionsFilter();

    response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const request = { url: '/api/v1/auth/login' };
    host = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: () => response,
        getRequest: () => request,
      }),
    };
  });

  it('should return 500 with defaults for unknown exception', () => {
    filter.catch('oops', host);

    expect(response.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        statusCode: 500,
        message: 'Internal server error',
        error: 'Internal Server Error',
        path: '/api/v1/auth/login',
        timestamp: expect.any(String),
      }),
    );
  });

  it('should use HttpException string message', () => {
    const exception = new HttpException('Not found', HttpStatus.NOT_FOUND);
    filter.catch(exception, host);

    expect(response.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 404,
        message: 'Not found',
      }),
    );
  });

  it('should join array of validation messages', () => {
    const responseBody = {
      statusCode: 400,
      message: ['email is required', 'password too short'],
      error: 'Bad Request',
    };
    const exception = new BadRequestException(responseBody);
    filter.catch(exception, host);

    expect(response.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        message: 'email is required, password too short',
        error: 'Bad Request',
      }),
    );
  });

  it('should handle object response with single message', () => {
    const exception = new HttpException(
      { statusCode: 409, message: 'Email sudah terdaftar', error: 'Conflict' },
      HttpStatus.CONFLICT,
    );
    filter.catch(exception, host);

    expect(response.status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 409,
        message: 'Email sudah terdaftar',
        error: 'Conflict',
      }),
    );
  });

  it('should use generic message when object message is empty', () => {
    const exception = new HttpException(
      { statusCode: 500, error: 'Internal' },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    filter.catch(exception, host);

    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Internal server error' }),
    );
  });

  it('should log and use message for plain Error', () => {
    const loggerSpy = jest.spyOn((filter as any).logger, 'error').mockImplementation();
    const exception = new Error('DB connection failed');

    filter.catch(exception, host);

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'DB connection failed' }),
    );
    expect(loggerSpy).toHaveBeenCalledWith(
      expect.stringContaining('DB connection failed'),
      expect.any(String),
    );
    loggerSpy.mockRestore();
  });

  it('should include request path', () => {
    filter.catch(new Error('x'), host);

    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/api/v1/auth/login' }),
    );
  });
});
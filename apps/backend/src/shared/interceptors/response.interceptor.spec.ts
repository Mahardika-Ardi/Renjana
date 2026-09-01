import { of } from 'rxjs';
import { ResponseInterceptor } from './response.interceptor';
import { SSE_METADATA } from '@nestjs/common/constants';

describe('ResponseInterceptor', () => {
  let interceptor: ResponseInterceptor<any>;
  let reflector: any;
  let context: any;
  let response: any;

  beforeEach(() => {
    reflector = {
      get: jest.fn(),
    };
    response = { statusCode: 200 };
    context = {
      getHandler: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({ getResponse: () => response }),
    };

    interceptor = new ResponseInterceptor(reflector);
  });

  it('should skip wrapping for SSE routes', (done) => {
    reflector.get.mockReturnValue(true);

    const result = interceptor.intercept(context, { handle: () => of({ raw: 'event' }) });

    result.subscribe((value: any) => {
      expect(reflector.get).toHaveBeenCalledWith(SSE_METADATA, context.getHandler());
      expect(value).toEqual({ raw: 'event' });
      done();
    });
  });

  it('should wrap plain data with success envelope', (done) => {
    reflector.get.mockReturnValue(false);

    const result = interceptor.intercept(context, {
      handle: () => of({ id: 'u-1' }),
    });

    result.subscribe((value: any) => {
      expect(value).toEqual({
        success: true,
        statusCode: 200,
        message: 'Request successful',
        data: { id: 'u-1' },
        timestamp: expect.any(String),
      });
      done();
    });
  });

  it('should use controller message and data when present', (done) => {
    reflector.get.mockReturnValue(false);

    const result = interceptor.intercept(context, {
      handle: () => of({ message: 'Berhasil login', data: { token: 'abc' } }),
    });

    result.subscribe((value: any) => {
      expect(value).toEqual({
        success: true,
        statusCode: 200,
        message: 'Berhasil login',
        data: { token: 'abc' },
        timestamp: expect.any(String),
      });
      done();
    });
  });

  it('should fall back to Success message if data only', (done) => {
    reflector.get.mockReturnValue(false);

    const result = interceptor.intercept(context, {
      handle: () => of(['a', 'b']),
    });

    result.subscribe((value: any) => {
      expect(value).toEqual({
        success: true,
        statusCode: 200,
        message: 'Request successful',
        data: ['a', 'b'],
        timestamp: expect.any(String),
      });
      done();
    });
  });
});
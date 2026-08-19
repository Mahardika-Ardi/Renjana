import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SSE_METADATA } from '@nestjs/common/constants';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface ControllerResponse<T> {
  message?: string;
  data: T;
}
@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  constructor(private readonly reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    // Skip wrapping for SSE responses (@Sse route)
    const isSse = this.reflector.get<boolean, string>(
      SSE_METADATA,
      context.getHandler(),
    );
    if (isSse) {
      return next.handle() as Observable<ApiResponse<T>>;
    }

    const response = context.switchToHttp().getResponse();

    return next.handle().pipe(
      map((response): ApiResponse<T> => {
        if (this.isControllerResponse(response)) {
          return {
            success: true,
            message: response.message ?? 'Request successful',
            data: response.data,
            timestamp: new Date().toISOString(),
          };
        }

        return {
          success: true,
          message: 'Request successful',
          data: response,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
  private isControllerResponse<T>(
    response: T | ControllerResponse<T>,
  ): response is ControllerResponse<T> {
    return (
      response !== null && typeof response === 'object' && 'data' in response
    );
  }
}

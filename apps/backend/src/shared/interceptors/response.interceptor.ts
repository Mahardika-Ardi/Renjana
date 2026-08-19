import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { ApiResponse } from '@renjana/types';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface ControllerResponse<T> {
  message?: string;
  data: T;
}
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T | ControllerResponse<T>,
  ApiResponse<T>
> {
  intercept(
    _context: ExecutionContext,
    next: CallHandler<T | ControllerResponse<T>>,
  ): Observable<ApiResponse<T>> | Promise<Observable<ApiResponse<T>>> {
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

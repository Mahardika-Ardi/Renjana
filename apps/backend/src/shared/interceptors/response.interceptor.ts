import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '@renjana/types';

/**
 * ResponseInterceptor — wrap semua response dalam format standar ApiResponse
 *
 * Output:
 * {
 *   success: true,
 *   message: "...",
 *   data: { ... },
 *   statusCode: 200
 * }
 */
@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const response = context.switchToHttp().getResponse();

    return next.handle().pipe(
      map((data) => {
        // Kalau controller return objek dengan `message` & `data`, pakai itu
        if (data && typeof data === 'object' && 'data' in data) {
          return {
            success: true,
            statusCode: response.statusCode,
            message: data.message ?? 'Success',
            data: data.data,
          } as ApiResponse<T>;
        }

        return {
          success: true,
          statusCode: response.statusCode,
          message: 'Success',
          data,
        } as ApiResponse<T>;
      }),
    );
  }
}

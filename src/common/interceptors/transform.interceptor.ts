import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

function normalizeValue(value: any): any {
  if (value === null || value === undefined) return value;

  if (Array.isArray(value)) {
    return value.map((item) => normalizeValue(item));
  }

  if (typeof value === 'bigint') {
    return value.toString();
  }

  if (value instanceof Date) {
    return value;
  }

  if (typeof value === 'object' && value !== null) {
    const result: Record<string, any> = {};

    for (const key of Object.keys(value)) {
      result[key] = normalizeValue(value[key]);
    }

    return result;
  }

  return value;
}

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((result: any) => {
        if (!result) return result;

        if (result.data !== undefined && result.meta !== undefined) {
          return {
            message: result.message ?? 'Success',
            data: {
              data: normalizeValue(result.data),
              meta: result.meta,
            },
          };
        }

        return {
          message: result.message ?? 'Success',
          data: normalizeValue(result.data ?? result),
        };
      }),
    );
  }
}

import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { IBaseResponse } from '../interfaces/base-response.interface';
import { Reflector } from '@nestjs/core';
import { RESPONSE_MESSAGE_KEY } from '../decorators/response-message.decorator';

@Injectable()
export class ResponseWrapperInterceptor<T> implements NestInterceptor<
  T,
  IBaseResponse<T>
> {
  constructor(@Inject(Reflector) private readonly reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<IBaseResponse<T>> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse();
    const messageFromDecorator = this.reflector.get<string>(
      RESPONSE_MESSAGE_KEY,
      context.getHandler(),
    );

    return next.handle().pipe(
      map((res) => {
        if (res && res.success !== undefined && res.statusCode !== undefined) {
          return res;
        }

        return {
          statusCode: response.statusCode || HttpStatus.OK,
          success: true,
          message: messageFromDecorator || res?.message || 'Success.',
          data: res?.data ?? res,
        };
      }),
    );
  }
}

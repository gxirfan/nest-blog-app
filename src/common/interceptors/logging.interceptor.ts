import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('SYSTEM_TRACE');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const httpContext = context.switchToHttp();
    const req = httpContext.getRequest();
    const res = httpContext.getResponse();

    const { method, originalUrl } = req;

    // IP adresini daha kapsamlı alalım (Proxy uyumlu)
    const ip =
      req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;
    const userAgent = req.get('user-agent') || 'Unknown Agent';

    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          this.logRequest(req, res, startTime, ip, userAgent);
        },
        error: (err) => {
          // Hata durumlarını da loglayalım ki sistemde ne patlamış görebilelim
          this.logRequest(req, res, startTime, ip, userAgent, err);
        },
      }),
    );
  }

  private logRequest(
    req: any,
    res: any,
    startTime: number,
    ip: string,
    userAgent: string,
    error?: any,
  ) {
    const duration = Date.now() - startTime;
    const statusCode = error ? error.status || 500 : res.statusCode;

    // Auth Guard'dan gelen kullanıcı verisini çekiyoruz
    const user = req.user;
    const identity = user
      ? `[User: ${user.username} | ID: ${user.id || user._id}]`
      : '[Guest]';

    const logMessage = `${req.method} ${req.originalUrl} ${statusCode} - ${duration}ms - ${identity} - IP: ${ip} - UA: ${userAgent}`;

    if (statusCode >= 500) {
      this.logger.error(logMessage);
    } else if (statusCode >= 400) {
      this.logger.warn(logMessage);
    } else {
      this.logger.log(logMessage);
    }
  }
}

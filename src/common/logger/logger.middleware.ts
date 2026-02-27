import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('NETWORK_LOG');

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl } = req;

    const ip =
      req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;

    const startTime = Date.now();

    res.on('finish', () => {
      const { statusCode } = res;
      const duration = Date.now() - startTime;

      const user = (req as any).user;
      const identity = user
        ? `[User: ${user.username} | ID: ${user.id || user._id}]`
        : '[Guest]';

      const logMessage = `${method} ${originalUrl} ${statusCode} - ${duration}ms - ${identity} - IP: ${ip}`;

      if (statusCode >= 500) {
        this.logger.error(logMessage);
      } else if (statusCode >= 400) {
        this.logger.warn(logMessage);
      } else {
        this.logger.log(logMessage);
      }
    });

    next();
  }
}

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Observable } from 'rxjs';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();

    const user = request.user;

    if (!user) {
      throw new ForbiddenException('you are not logged in');
    }

    if (
      user.role &&
      (user.role === UserRole.ADMIN || user.role === UserRole.MODERATOR) &&
      user.status === 'active'
    ) {
      return true;
    } else {
      throw new ForbiddenException('you are not admin');
    }
  }
}

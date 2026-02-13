import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class AuthenticatedGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    if (!request.isAuthenticated()) {
      throw new UnauthorizedException(
        'You must be authenticated to access this resource.',
      );
    }

    return true;
  }
}

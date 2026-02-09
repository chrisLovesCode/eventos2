import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<{
      headers?: Record<string, string | undefined>;
      cookies?: Record<string, string | undefined>;
    }>();

    const authHeader = request.headers?.authorization;
    const cookieToken = request.cookies?.access_token;

    // If no auth header and no cookie, allow access without user
    if (!authHeader && !cookieToken) {
      return true;
    }

    // If auth header present, validate it and populate request.user
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any) {
    // If error or no user, just return undefined (don't throw)
    // This allows the endpoint to work with or without auth
    if (err || !user) {
      return undefined;
    }
    return user;
  }
}

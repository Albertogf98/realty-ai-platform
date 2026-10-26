import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    console.log(context);
    return super.canActivate(context);
  }

  handleRequest(err, user, info, context) {
    return super.handleRequest(err, user, info, context);
  }
}

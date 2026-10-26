import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Role } from '@prisma/client';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(
    @Body('email') email: string,
    @Body('password') password: string,
  ) {
    return this.authService.login(email, password);
  }

  @Post('refresh')
  async refresh(@Body() body: { refreshToken: string; userId: string }) {
    return this.authService.refreshToken(body.userId, body.refreshToken);
  }

  @Post('register')
  async register(
    @Body('email') email: string,
    @Body('password') password: string,
    @Body('name') name?: string,
    @Body('role') role?: Role,
  ) {
    return this.authService.register(email, password, name, role);
  }
}

import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import { UsersRepository } from 'src/users/users.repository';
import bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersRepo: UsersRepository,
    private jwtService: JwtService,
  ) {}

  async register(
    email: string,
    password: string,
    name?: string,
    role: Role = Role.USER,
  ) {
    const hashed = await bcrypt.hash(password, 10);

    const userExist = await this.usersRepo.findByEmail(email);
    if (userExist) throw new ConflictException('User already exists');

    const user = await this.usersRepo.create({
      email,
      password: hashed,
      name,
      role,
    });

    const payload = { sub: user.id, email: user.email, role: user.role };
    return { access_token: this.jwtService.sign(payload) };
  }

  async login(email: string, password: string) {
    const user = await this.usersRepo.findByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const payload = { sub: user.id, email: user.email, role: user.role };
    const access_token = this.jwtService.sign(payload, { expiresIn: '30m' });
    const refresh_token = this.jwtService.sign(payload, { expiresIn: '1d' });

    await this.usersRepo.updateRefreshToken(user.id, refresh_token);

    return {
      user: { id: user.id, email: user.email, role: user.role },
      access_token,
      refresh_token,
    };
  }

  async refreshToken(userId: string, token: string) {
    const user = await this.usersRepo.findById(userId);
    if (!user || user.refreshToken !== token)
      throw new UnauthorizedException('Invalid refresh token');

    const payload = { sub: user.id, email: user.email, role: user.role };
    const access_token = this.jwtService.sign(payload, { expiresIn: '20m' });

    return { access_token };
  }
}

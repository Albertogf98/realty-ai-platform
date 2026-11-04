import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import { UsersRepository } from 'src/users/users.repository';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('public registration', () => {
  it('ignores a client-supplied elevated role', async () => {
    const usersRepository = {
      findByEmail: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({
        id: 'user-id',
        email: 'person@example.com',
        role: Role.USER,
      }),
    };
    const jwtService = {
      sign: jest.fn().mockReturnValue('access-token'),
    };
    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersRepository, useValue: usersRepository },
        { provide: JwtService, useValue: jwtService },
      ],
      controllers: [AuthController],
    }).compile();
    const authController = moduleRef.get(AuthController);

    await authController.register({
      email: 'person@example.com',
      password: 'password123',
      role: Role.ADMIN,
    });

    expect(usersRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ role: Role.USER }),
    );
    await moduleRef.close();
  });
});

import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Role, User } from '@prisma/client';
import { CacheService } from 'src/cache/cache.service';
import { TypesenseService } from 'src/typesense/typesense.service';

@Injectable()
export class UsersRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly typesense: TypesenseService,
  ) {}

  findAll(): Promise<User[]> {
    return this.prisma.user.findMany();
  }

  async findOne(id: string): Promise<User | null> {
    const cacheKey = `user:${id}:profile`;
    const cached = await this.cache.get<User>(cacheKey);
    if (cached) return cached;

    const user = await this.prisma.user.findUnique({ where: { id } });
    if (user) await this.cache.set(cacheKey, user, 600);

    return user;
  }

  async findAllAgents(): Promise<User[]> {
    const cacheKey = `agents:all`;
    const cached = await this.cache.get<User[]>(cacheKey);
    if (cached) return cached;

    const agents = await this.prisma.user.findMany({
      where: { role: Role.AGENT },
    });
    await this.cache.set(cacheKey, agents, 600);
    return agents;
  }

  async update(id: string, data: Partial<User>) {
    const user = await this.prisma.user.update({ where: { id }, data });

    if (user.role === Role.AGENT) {
      try {
        await this.typesense
          .getClient()
          .collections('users')
          .documents(id)
          .update({
            id: user.id,
            name: user.name || '',
            email: user.email,
            role: user.role,
          });
      } catch (err) {
        console.error('Error updating user in Typesense', err);
      }
    }

    return user;
  }

  async remove(id: string) {
    const user = await this.prisma.user.delete({ where: { id } });

    try {
      await this.typesense
        .getClient()
        .collections('users')
        .documents(id)
        .delete();
    } catch (err) {
      console.error('Error deleting user from Typesense', err);
    }

    return user;
  }

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async create(data: {
    email: string;
    password: string;
    name?: string;
    role: Role;
  }) {
    const user = await this.prisma.user.create({ data });

    if (user.role === Role.AGENT) {
      try {
        await this.typesense
          .getClient()
          .collections('users')
          .documents()
          .create({
            id: user.id,
            name: user.name || '',
            email: user.email,
            role: user.role,
          });
      } catch (err) {
        console.error('Error indexing user in Typesense', err);
      }
    }

    return user;
  }

  updateRefreshToken(userId: string, refreshToken: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken },
    });
  }
}

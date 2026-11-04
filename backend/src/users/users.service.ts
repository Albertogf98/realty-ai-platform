import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { User, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

type UserProfile = Pick<User, 'id' | 'email' | 'name' | 'role' | 'createdAt'>;

@Injectable()
export class UsersService {
  constructor(private readonly repo: UsersRepository) {}

  async findAll(): Promise<
    Array<Pick<User, 'id' | 'email' | 'name' | 'role' | 'createdAt'>>
  > {
    return this.repo.findAll();
  }

  async findOne(
    id: string,
  ): Promise<Pick<User, 'id' | 'email' | 'name' | 'role' | 'createdAt'>> {
    const user = await this.repo.findOne(id);
    if (!user) throw new NotFoundException('User not found');

    return user;
  }

  async update(
    id: string,
    data: Partial<{
      name: string;
      email: string;
      password: string;
      role: Role;
    }>,
  ): Promise<UserProfile> {
    const changes: Partial<User> = { ...data };
    if (changes.email) changes.email = changes.email.trim().toLowerCase();
    if (changes.password) {
      changes.password = await bcrypt.hash(changes.password, 10);
      changes.refreshToken = null;
    }
    return this.repo.update(id, changes);
  }

  async remove(id: string): Promise<UserProfile> {
    const user = await this.repo.findOne(id);
    if (!user) throw new NotFoundException('User not found');

    return this.repo.remove(id);
  }

  async findAllAgents(): Promise<Array<Pick<User, 'id' | 'name' | 'role'>>> {
    return this.repo.findAllAgents();
  }
}

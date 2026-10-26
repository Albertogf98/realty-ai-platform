import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { User, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly repo: UsersRepository) {}

  async findAll(): Promise<User[]> {
    return this.repo.findAll();
  }

  async findOne(id: string): Promise<User> {
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
  ): Promise<User> {
    if (data.password) data.password = await bcrypt.hash(data.password, 10);
    return this.repo.update(id, data);
  }

  async remove(id: string): Promise<User> {
    const user = await this.repo.findOne(id);
    if (!user) throw new NotFoundException('User not found');

    return this.repo.remove(id);
  }

  async findAllAgents(): Promise<User[]> {
    return this.repo.findAllAgents();
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Appointment } from '@prisma/client';
import { CacheService } from 'src/cache/cache.service';

@Injectable()
export class AppointmentRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  async create(data: {
    userId: string;
    agentId: string;
    propertyId: string;
    date: Date;
  }) {
    const appointment = await this.prisma.appointment.create({
      data,
      include: { property: true, user: true, agent: true },
    });

    await this.cache.del(`user:${data.userId}:appointments`);
    await this.cache.del(`agent:${data.agentId}:appointments`);

    return appointment;
  }

  async findByUser(userId: string): Promise<Appointment[]> {
    const cacheKey = `user:${userId}:appointments`;
    const cached = await this.cache.get<Appointment[]>(cacheKey);
    if (cached) return cached;

    const appointments = await this.prisma.appointment.findMany({
      where: { userId },
      include: { property: true, agent: true },
    });

    await this.cache.set(cacheKey, appointments, 60);
    return appointments;
  }

  async findByAgent(agentId: string): Promise<Appointment[]> {
    const cacheKey = `agent:${agentId}:appointments`;
    const cached = await this.cache.get<Appointment[]>(cacheKey);
    if (cached) return cached;

    const appointments = await this.prisma.appointment.findMany({
      where: { agentId },
      include: { property: true, user: true },
    });

    await this.cache.set(cacheKey, appointments, 60);
    return appointments;
  }

  async deleteById(appointmentId: string): Promise<Appointment> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment) throw new NotFoundException('Appointment not found');

    const deleted = await this.prisma.appointment.delete({
      where: { id: appointmentId },
    });

    await this.cache.del(`user:${appointment.userId}:appointments`);
    await this.cache.del(`agent:${appointment.agentId}:appointments`);

    return deleted;
  }
}

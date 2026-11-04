import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
    const property = await this.prisma.property.findUnique({
      where: { id: data.propertyId },
      select: { agentId: true },
    });
    if (!property) throw new NotFoundException('Property not found');
    if (property.agentId !== data.agentId) {
      throw new BadRequestException(
        'The selected agent does not manage this property',
      );
    }

    const appointment = await this.prisma.appointment.create({
      data,
      include: {
        property: true,
        user: { select: { id: true, name: true, role: true } },
        agent: { select: { id: true, name: true, role: true } },
      },
    });

    await this.cache.del(`user:${data.userId}:appointments:v2`);
    await this.cache.del(`agent:${data.agentId}:appointments:v2`);

    return appointment;
  }

  async findByUser(userId: string): Promise<Appointment[]> {
    const cacheKey = `user:${userId}:appointments:v2`;
    const cached = await this.cache.get<Appointment[]>(cacheKey);
    if (cached) return cached;

    const appointments = await this.prisma.appointment.findMany({
      where: { userId },
      include: {
        property: true,
        agent: { select: { id: true, name: true, role: true } },
      },
    });

    await this.cache.set(cacheKey, appointments, 60);
    return appointments;
  }

  async findByAgent(agentId: string): Promise<Appointment[]> {
    const cacheKey = `agent:${agentId}:appointments:v2`;
    const cached = await this.cache.get<Appointment[]>(cacheKey);
    if (cached) return cached;

    const appointments = await this.prisma.appointment.findMany({
      where: { agentId },
      include: {
        property: true,
        user: { select: { id: true, name: true, role: true } },
      },
    });

    await this.cache.set(cacheKey, appointments, 60);
    return appointments;
  }

  findById(appointmentId: string): Promise<Appointment | null> {
    return this.prisma.appointment.findUnique({ where: { id: appointmentId } });
  }

  async hasMessageFromUser(
    propertyId: string,
    userId: string,
  ): Promise<boolean> {
    const message = await this.prisma.message.findFirst({
      where: { propertyId, senderId: userId },
      select: { id: true },
    });
    return message !== null;
  }

  async deleteById(appointmentId: string): Promise<Appointment> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment) throw new NotFoundException('Appointment not found');

    const deleted = await this.prisma.appointment.delete({
      where: { id: appointmentId },
    });

    await this.cache.del(`user:${appointment.userId}:appointments:v2`);
    await this.cache.del(`agent:${appointment.agentId}:appointments:v2`);

    return deleted;
  }
}

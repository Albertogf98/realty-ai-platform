// appointment.service.ts
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AppointmentRepository } from './appointment.repository';
import { Appointment, Role } from '@prisma/client';

@Injectable()
export class AppointmentService {
  constructor(private readonly repository: AppointmentRepository) {}

  async createAppointment(
    requesterId: string,
    requesterRole: Role,
    userId: string,
    agentId: string,
    propertyId: string,
    date: Date,
  ): Promise<Appointment> {
    if (requesterRole === Role.USER && userId !== requesterId) {
      throw new ForbiddenException(
        'You can only book appointments for yourself',
      );
    }

    if (requesterRole === Role.AGENT) {
      if (agentId !== requesterId) {
        throw new ForbiddenException(
          'You can only book appointments for your listings',
        );
      }
      if (!(await this.repository.hasMessageFromUser(propertyId, userId))) {
        throw new ForbiddenException(
          'The customer must have contacted you about this property',
        );
      }
    }

    if (requesterRole === Role.ADMIN) {
      throw new ForbiddenException(
        'Administrators cannot create customer appointments',
      );
    }

    return this.repository.create({ userId, agentId, propertyId, date });
  }

  async getAppointmentsByUser(userId: string): Promise<Appointment[]> {
    return this.repository.findByUser(userId);
  }

  async getAppointmentsByAgent(agentId: string): Promise<Appointment[]> {
    return this.repository.findByAgent(agentId);
  }

  async deleteAppointment(
    appointmentId: string,
    userId: string,
    role: Role,
  ): Promise<Appointment> {
    const existing = await this.repository.findById(appointmentId);
    if (!existing) throw new NotFoundException('Appointment not found');
    if (
      role !== Role.ADMIN &&
      existing.userId !== userId &&
      existing.agentId !== userId
    ) {
      throw new ForbiddenException('You can only manage your own appointments');
    }

    return this.repository.deleteById(appointmentId);
  }
}

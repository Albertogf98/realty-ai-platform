// appointment.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { AppointmentRepository } from './appointment.repository';
import { Appointment } from '@prisma/client';

@Injectable()
export class AppointmentService {
  constructor(private readonly repository: AppointmentRepository) {}

  async createAppointment(
    userId: string,
    agentId: string,
    propertyId: string,
    date: Date,
  ): Promise<Appointment> {
    return this.repository.create({ userId, agentId, propertyId, date });
  }

  async getAppointmentsByUser(userId: string): Promise<Appointment[]> {
    return this.repository.findByUser(userId);
  }

  async getAppointmentsByAgent(agentId: string): Promise<Appointment[]> {
    return this.repository.findByAgent(agentId);
  }

  async deleteAppointment(appointmentId: string): Promise<Appointment> {
    const appointment = await this.repository.deleteById(appointmentId);

    if (!appointment) throw new NotFoundException('Appointment not found');

    return appointment;
  }
}

import { Controller, Post, Get, Param, Body, Delete } from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';

@Controller('appointments')
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  @Post()
  async create(@Body() createDto: CreateAppointmentDto) {
    const { userId, agentId, propertyId, date } = createDto;
    return this.appointmentService.createAppointment(
      userId,
      agentId,
      propertyId,
      new Date(date),
    );
  }

  @Get('user/:userId')
  async getByUser(@Param('userId') userId: string) {
    return this.appointmentService.getAppointmentsByUser(userId);
  }

  @Get('agent/:agentId')
  async getByAgent(@Param('agentId') agentId: string) {
    return this.appointmentService.getAppointmentsByAgent(agentId);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.appointmentService.deleteAppointment(id);
  }
}

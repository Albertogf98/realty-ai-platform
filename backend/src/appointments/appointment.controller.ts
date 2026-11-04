import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from 'src/auth/types/authenticated-request';
import { Role } from '@prisma/client';

@Controller('appointments')
@UseGuards(JwtAuthGuard)
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  @Post()
  async create(
    @Body() createDto: CreateAppointmentDto,
    @Req() request: AuthenticatedRequest,
  ) {
    const { agentId, propertyId, date } = createDto;
    return this.appointmentService.createAppointment(
      request.user.id,
      request.user.role,
      createDto.userId,
      agentId,
      propertyId,
      new Date(date),
    );
  }

  @Get('user/:userId')
  async getByUser(
    @Param('userId', new ParseUUIDPipe()) userId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    this.assertOwnerOrAdmin(userId, request);
    return this.appointmentService.getAppointmentsByUser(userId);
  }

  @Get('agent/:agentId')
  async getByAgent(
    @Param('agentId', new ParseUUIDPipe()) agentId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    this.assertOwnerOrAdmin(agentId, request);
    return this.appointmentService.getAppointmentsByAgent(agentId);
  }

  @Delete(':id')
  async remove(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.appointmentService.deleteAppointment(
      id,
      request.user.id,
      request.user.role,
    );
  }

  private assertOwnerOrAdmin(id: string, request: AuthenticatedRequest) {
    if (request.user.id !== id && request.user.role !== Role.ADMIN) {
      throw new ForbiddenException('You can only view your own appointments');
    }
  }
}

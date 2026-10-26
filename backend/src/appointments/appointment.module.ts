import { Module } from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { AppointmentController } from './appointment.controller';
import { PrismaService } from '../prisma/prisma.service';
import { AppointmentRepository } from './appointment.repository';
import { CacheService } from 'src/cache/cache.service';

@Module({
  controllers: [AppointmentController],
  providers: [
    AppointmentService,
    PrismaService,
    AppointmentRepository,
    CacheService,
  ],
  exports: [AppointmentService],
})
export class AppointmentModule {}

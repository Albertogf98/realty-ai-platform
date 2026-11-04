import { IsDateString, IsUUID } from 'class-validator';

export class CreateAppointmentDto {
  @IsUUID()
  userId: string;

  @IsUUID()
  agentId: string;

  @IsUUID()
  propertyId: string;

  @IsDateString()
  date: string;
}

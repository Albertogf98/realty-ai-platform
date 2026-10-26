import { IsString, IsDateString } from 'class-validator';

export class CreateAppointmentDto {
  @IsString()
  userId: string;

  @IsString()
  agentId: string;

  @IsString()
  propertyId: string;

  @IsDateString()
  date: string;
}

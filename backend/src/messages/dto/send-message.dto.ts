import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class SendMessageDto {
  @IsUUID()
  senderId: string;

  @IsUUID()
  propertyId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  content: string;
}

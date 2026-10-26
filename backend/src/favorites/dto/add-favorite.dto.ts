import { IsString } from 'class-validator';

export class AddFavoriteDto {
  @IsString()
  userId: string;

  @IsString()
  propertyId: string;
}

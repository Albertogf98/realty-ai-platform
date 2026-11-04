import { OperationType, PropertyStatus, PropertyType } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreatePropertyDto {
  @IsString()
  @MaxLength(200)
  title_es: string;
  @IsString()
  @MaxLength(200)
  title_en: string;
  @IsString()
  @MaxLength(10_000)
  description_es: string;
  @IsString()
  @MaxLength(10_000)
  description_en: string;
  @Type(() => Number)
  @IsInt()
  @Min(1)
  price: number;
  @IsEnum(PropertyType)
  type: PropertyType;
  @IsEnum(PropertyStatus)
  status: PropertyStatus;
  @IsEnum(OperationType)
  operation: OperationType;
  @Type(() => Number)
  @IsInt()
  @Min(0)
  rooms: number;
  @Type(() => Number)
  @IsInt()
  @Min(0)
  bathrooms: number;
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  sqm: number;
  @IsString()
  @MaxLength(300)
  address: string;
  @IsString()
  @MaxLength(100)
  city: string;
  @IsString()
  @MaxLength(100)
  state: string;
  @IsString()
  @MaxLength(100)
  country: string;
  @IsString()
  @MaxLength(20)
  zipCode: string;
  @IsOptional()
  @IsString()
  agentId: string;
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  parking: boolean;
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  garden: boolean;
}

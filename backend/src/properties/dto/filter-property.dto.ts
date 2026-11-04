import { z } from 'zod';
import { PropertyType, PropertyStatus, OperationType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

const propertyTypeSchema = z.enum(['HOUSE', 'APARTMENT']);
const propertyOperationSchema = z.enum(['SALE', 'RENT']);
const propertyStatusSchema = z.enum(['NEW', 'USED', 'TO_RENOVATE']);

export const propertyFiltersSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    city: z.string().trim().min(1).max(100).optional(),
    type: propertyTypeSchema.optional(),
    minPrice: z.coerce.number().finite().positive().optional(),
    maxPrice: z.coerce.number().finite().positive().optional(),
    rooms: z.coerce.number().int().positive().optional(),
    bathrooms: z.coerce.number().int().positive().optional(),
    status: propertyStatusSchema.optional(),
    operation: propertyOperationSchema.optional(),
    page: z.coerce.number().int().positive().max(1_000_000).optional(),
    pageSize: z.coerce.number().int().positive().max(100).optional(),
  })
  .transform((filters) => {
    if (
      filters.minPrice !== undefined &&
      filters.maxPrice !== undefined &&
      filters.minPrice > filters.maxPrice
    ) {
      return {
        ...filters,
        minPrice: undefined,
      };
    }

    return filters;
  });

export type PropertyFilters = z.infer<typeof propertyFiltersSchema>;

export class PropertyFilterQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsEnum(PropertyType)
  type?: PropertyType;

  @IsOptional()
  @IsEnum(PropertyStatus)
  status?: PropertyStatus;

  @IsOptional()
  @IsEnum(OperationType)
  operation?: OperationType;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  rooms?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  bathrooms?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1_000_000)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;
}

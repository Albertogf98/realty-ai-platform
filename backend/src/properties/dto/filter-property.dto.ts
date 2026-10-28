import { z } from 'zod';

const propertyTypeSchema = z.enum(['HOUSE', 'APARTMENT']);
const propertyOperationSchema = z.enum(['SALE', 'RENT']);
const propertyStatusSchema = z.enum(['NEW', 'USED', 'TO_RENOVATE']);

export const propertyFiltersSchema = z
  .object({
    title: z.string().trim().min(1).optional(),
    city: z.string().trim().min(1).optional(),
    type: propertyTypeSchema.optional(),
    minPrice: z.coerce.number().finite().positive().optional(),
    maxPrice: z.coerce.number().finite().positive().optional(),
    rooms: z.coerce.number().int().positive().optional(),
    bathrooms: z.coerce.number().int().positive().optional(),
    status: propertyStatusSchema.optional(),
    operation: propertyOperationSchema.optional(),
    page: z.coerce.number().int().positive().optional(),
    pageSize: z.coerce.number().int().positive().optional(),
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

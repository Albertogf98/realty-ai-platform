import { OperationType, PropertyStatus, PropertyType } from '@prisma/client';

export class CreatePropertyDto {
  title_es: string;
  title_en: string;
  description_es: string;
  description_en: string;
  price: number;
  type: PropertyType;
  status: PropertyStatus;
  operation: OperationType;
  rooms: number;
  bathrooms: number;
  sqm: number;
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  agentId: string;
  parking: boolean;
  garden: boolean;
  images?: { url: string }[];
}

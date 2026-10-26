export interface PropertyFilters {
  title?: string;
  city?: string;
  type?: string;
  status?: string;
  operation?: string;
  minPrice?: number;
  maxPrice?: number;
  rooms?: number;
  bathrooms?: number;
  page?: number;
  pageSize?: number;
}

export interface PropertyFiltersPaginatedResponse {
  data: Property[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

export enum PropertyType {
  HOUSE = 'HOUSE',
  APARTMENT = 'APARTMENT',
}

export enum PropertyStatus {
  NEW = 'NEW',
  USED = 'USED',
  TO_RENOVATE = 'TO_RENOVATE',
}

export enum OperationType {
  SALE = 'SALE',
  RENT = 'RENT',
}

export interface Property {
  id: string;
  title_es: string;
  title_en: string;
  description_es: string;
  description_en: string;
  price: number;
  rooms: number;
  bathrooms: number;
  sqm: number;
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  agentId: string;
  type: string;
  latitude?: number;
  longitude?: number;
  parking?: boolean;
  garden?: boolean;
  operation?: string;
  images: { url: string }[];
  agent: { id: string; name: string; email: string; phone?: string };
}

export interface CreatePropertyDto {
  titleEs: string;
  titleEn: string;
  descriptionEs: string;
  descriptionEn: string;
  price: number;
  type: PropertyType;
  status: PropertyStatus;
  operation: OperationType;
  rooms: number;
  bathrooms: number;
  sqm: number;
  address: string;
  city: string;
  stateCity: string;
  country: string;
  zipCode: string;
  latitude: number;
  longitude: number;
  agentId: string;
  parking: boolean;
  garden: boolean;
  images: File[];
}

export interface PropertyImage {
  url: string;
  file?: File;
}

export interface UpdatePropertyDto {
  id: string;
  title_es?: string;
  title_en?: string;
  description_es?: string;
  description_en?: string;
  price?: number;
  rooms?: number;
  bathrooms?: number;
  sqm?: number;
  parking?: boolean;
  garden?: boolean;
  agentId?: string;
  buyerId?: string;
  images?: {
    id?: string;
    url: string;
  }[];
}

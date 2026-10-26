export interface PropertyFilters {
  title?: string;
  city?: string;
  type?: 'HOUSE' | 'APARTMENT';
  minPrice?: number;
  maxPrice?: number;
  rooms?: number;
  bathrooms?: number;
  status?: 'NEW' | 'USED' | 'TO_RENOVATE';
  operation?: 'SALE' | 'RENT';
  page?: number;
  pageSize?: number;
}

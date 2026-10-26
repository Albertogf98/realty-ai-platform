import { Property } from './property.interface';

export interface Favorite {
  id: string;
  propertyId: string;
  property: Property;
}

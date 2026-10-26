import { Property } from './property.interface';
import { User } from './user.interface';

export interface AppointmentWithRelations {
  id: string;
  date: string;
  property: Property;
  user: User;
  agent: User;
}

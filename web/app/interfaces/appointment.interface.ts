import { Property } from './property.interface';
import { User } from './user.interface';

type AppointmentUser = Pick<User, 'id' | 'name' | 'role'>;

export interface AppointmentWithRelations {
  id: string;
  date: string;
  property: Property;
  user: AppointmentUser;
  agent: AppointmentUser;
}

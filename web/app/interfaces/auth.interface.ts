import { User } from './user.interface';

export interface LoginData {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  access_token: string;
  refresh_token: string;
}

export interface RegisterBody {
  email: string;
  password: string;
  name: string;
  role: 'AGENT' | 'USER' | string;
}

export interface RegisterResponse {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
}

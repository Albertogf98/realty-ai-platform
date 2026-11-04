export interface Agent {
  id: string;
  name: string;
}

export interface City {
  city: string;
  state: string;
}

export interface User {
  id: string;
  email: string;
  name?: string | null;
  role: 'AGENT' | 'USER' | 'ADMIN';
}

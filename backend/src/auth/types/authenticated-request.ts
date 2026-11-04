import { Role } from '@prisma/client';
import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    role: Role;
  };
}

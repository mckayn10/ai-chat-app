import { Generated } from 'kysely';

export interface Database {
  contacts: ContactTable;
}

export interface ContactTable {
  id: Generated<number>;
  userId: number;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  createdAt: Generated<Date>;
  updatedAt: Generated<Date>;
} 
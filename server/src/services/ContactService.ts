import { Kysely } from 'kysely';
import { Contact } from '../models/Contact';
import { Database } from '../db/types';

export class ContactService {
  constructor(private db: Kysely<Database>) {}

  async findByName(userId: number, firstName: string, lastName?: string): Promise<Contact[]> {
    try {
      const query = this.db
        .selectFrom('contacts')
        .selectAll()
        .where('userId', '=', userId)
        .where('firstName', '=', firstName);

      if (lastName) {
        query.where('lastName', '=', lastName);
      }

      const contacts = await query.execute();
      return contacts as Contact[];
    } catch (error) {
      console.error('Error finding contact by name:', error);
      throw new Error('Failed to find contact by name');
    }
  }
} 
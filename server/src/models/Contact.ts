import pool from '../db/config';

export interface Contact {
  id: number;
  userId: number;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContactInput {
  userId: number;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  notes?: string;
}

export class ContactModel {
  static async create(contactData: ContactInput): Promise<Contact> {
    const { userId, firstName, lastName, email, phone, notes } = contactData;

    const result = await pool.query(
      `INSERT INTO contacts (user_id, first_name, last_name, email, phone, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, user_id as "userId", first_name as "firstName", last_name as "lastName",
                 email, phone, notes, created_at as "createdAt", updated_at as "updatedAt"`,
      [userId, firstName, lastName, email, phone, notes]
    );

    return result.rows[0];
  }

  static async findByUserId(userId: number): Promise<Contact[]> {
    const result = await pool.query(
      `SELECT id, user_id as "userId", first_name as "firstName", last_name as "lastName",
              email, phone, notes, created_at as "createdAt", updated_at as "updatedAt"
       FROM contacts
       WHERE user_id = $1
       ORDER BY first_name, last_name`,
      [userId]
    );

    return result.rows;
  }

  static async delete(userId: number, contactId: number): Promise<boolean> {
    const result = await pool.query(
      'DELETE FROM contacts WHERE user_id = $1 AND id = $2 RETURNING id',
      [userId, contactId]
    );

    return (result.rowCount ?? 0) > 0;
  }

  static async update(userId: number, contactId: number, updates: Partial<ContactInput>): Promise<Contact | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (updates.firstName !== undefined) {
      fields.push(`first_name = $${paramCount}`);
      values.push(updates.firstName);
      paramCount++;
    }
    if (updates.lastName !== undefined) {
      fields.push(`last_name = $${paramCount}`);
      values.push(updates.lastName);
      paramCount++;
    }
    if (updates.email !== undefined) {
      fields.push(`email = $${paramCount}`);
      values.push(updates.email);
      paramCount++;
    }
    if (updates.phone !== undefined) {
      fields.push(`phone = $${paramCount}`);
      values.push(updates.phone);
      paramCount++;
    }
    if (updates.notes !== undefined) {
      fields.push(`notes = $${paramCount}`);
      values.push(updates.notes);
      paramCount++;
    }

    if (fields.length === 0) return null;

    values.push(userId, contactId);
    const result = await pool.query(
      `UPDATE contacts 
       SET ${fields.join(', ')}
       WHERE user_id = $${paramCount} AND id = $${paramCount + 1}
       RETURNING id, user_id as "userId", first_name as "firstName", last_name as "lastName",
                 email, phone, notes, created_at as "createdAt", updated_at as "updatedAt"`,
      values
    );

    return result.rows[0] || null;
  }

  static async findByName(userId: number, firstName: string, lastName?: string): Promise<Contact[]> {
    let query = `
      SELECT id, user_id as "userId", first_name as "firstName", last_name as "lastName",
             email, phone, notes, created_at as "createdAt", updated_at as "updatedAt"
      FROM contacts
      WHERE user_id = $1 AND LOWER(first_name) = LOWER($2)
    `;
    const params = [userId, firstName];

    if (lastName) {
      query += ` AND LOWER(last_name) = LOWER($3)`;
      params.push(lastName);
    }

    query += ` ORDER BY first_name, last_name`;

    const result = await pool.query(query, params);
    return result.rows;
  }
} 
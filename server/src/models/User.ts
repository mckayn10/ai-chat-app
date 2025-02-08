import pool from '../db/config';
import bcrypt from 'bcrypt';

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserInput {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
}

export class UserModel {
  static async create(userData: UserInput): Promise<User> {
    const { email, firstName, lastName, password } = userData;
    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (email, first_name, last_name, password_hash)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, first_name as "firstName", last_name as "lastName", created_at as "createdAt", updated_at as "updatedAt"`,
      [email, firstName, lastName, passwordHash]
    );

    return result.rows[0];
  }

  static async findByEmail(email: string): Promise<User | null> {
    const result = await pool.query(
      `SELECT id, email, first_name as "firstName", last_name as "lastName", created_at as "createdAt", updated_at as "updatedAt"
       FROM users
       WHERE email = $1`,
      [email]
    );

    return result.rows[0] || null;
  }

  static async verifyPassword(email: string, password: string): Promise<boolean> {
    const result = await pool.query(
      'SELECT password_hash FROM users WHERE email = $1',
      [email]
    );

    if (!result.rows[0]) return false;

    return bcrypt.compare(password, result.rows[0].password_hash);
  }

  static async list(): Promise<User[]> {
    const result = await pool.query(
      `SELECT id, email, first_name as "firstName", last_name as "lastName", created_at as "createdAt", updated_at as "updatedAt"
       FROM users
       ORDER BY created_at DESC`
    );

    return result.rows;
  }

  static async delete(email: string): Promise<boolean> {
    const result = await pool.query(
      'DELETE FROM users WHERE email = $1 RETURNING id',
      [email]
    );

    return (result.rowCount ?? 0) > 0;
  }
} 
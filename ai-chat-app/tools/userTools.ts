import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

const USERS_KEY = '@kairos_users';
const CURRENT_USER_KEY = '@kairos_current_user';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  passwordHash: string;
  createdAt: string;
}

interface CreateUserResult {
  success: boolean;
  message?: string;
  user?: Omit<User, 'passwordHash'>;
}

interface LoginResult {
  success: boolean;
  message?: string;
  user?: Omit<User, 'passwordHash'>;
}

export const userTools = {
  async hashPassword(password: string): Promise<string> {
    try {
      const hash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        password
      );
      return hash;
    } catch (error) {
      console.error('Error hashing password:', error);
      throw error;
    }
  },

  async createUser(
    email: string,
    firstName: string,
    lastName: string,
    password: string
  ): Promise<CreateUserResult> {
    try {
      console.log('Creating user with email:', email);

      if (!email?.trim() || !firstName?.trim() || !lastName?.trim() || !password?.trim()) {
        return {
          success: false,
          message: 'All fields are required',
        };
      }

      if (password.length < 6) {
        return {
          success: false,
          message: 'Password must be at least 6 characters long',
        };
      }

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return {
          success: false,
          message: 'Please enter a valid email address',
        };
      }

      // Get existing users
      const usersJson = await AsyncStorage.getItem(USERS_KEY);
      console.log('Current users in storage:', usersJson);
      
      let users: User[] = [];
      try {
        users = usersJson ? JSON.parse(usersJson) : [];
        if (!Array.isArray(users)) {
          console.error('Users data is not an array:', users);
          users = [];
        }
      } catch (parseError) {
        console.error('Error parsing users JSON:', parseError);
        users = [];
      }

      const userExists = users.some((user) => {
        return user && typeof user.email === 'string' && 
          user.email.toLowerCase() === email.toLowerCase();
      });

      if (userExists) {
        return {
          success: false,
          message: 'An account with this email already exists',
        };
      }

      const passwordHash = await this.hashPassword(password);
      const newUser: User = {
        id: Date.now().toString(),
        email: email.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        passwordHash,
        createdAt: new Date().toISOString(),
      };

      const updatedUsers = [...users, newUser];
      await AsyncStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers));
      console.log('Successfully saved user to storage');

      const userWithoutHash = {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        createdAt: newUser.createdAt,
      };
      await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userWithoutHash));
      console.log('Successfully saved current user');

      return {
        success: true,
        user: userWithoutHash,
      };
    } catch (error) {
      console.error('Error creating user:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create user',
      };
    }
  },

  async login(email: string, password: string): Promise<LoginResult> {
    try {
      if (!email?.trim() || !password?.trim()) {
        return {
          success: false,
          message: 'Email and password are required',
        };
      }

      const usersJson = await AsyncStorage.getItem(USERS_KEY);
      let users: User[] = [];
      try {
        users = usersJson ? JSON.parse(usersJson) : [];
        if (!Array.isArray(users)) {
          console.error('Users data is not an array:', users);
          users = [];
        }
      } catch (parseError) {
        console.error('Error parsing users JSON:', parseError);
        users = [];
      }

      const user = users.find(
        (u) => u && typeof u.email === 'string' && 
          u.email.toLowerCase() === email.toLowerCase()
      );

      if (!user) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      const passwordHash = await this.hashPassword(password);
      if (passwordHash !== user.passwordHash) {
        return {
          success: false,
          message: 'Incorrect password',
        };
      }

      const userWithoutHash = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        createdAt: user.createdAt,
      };
      await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userWithoutHash));

      return {
        success: true,
        user: userWithoutHash,
      };
    } catch (error) {
      console.error('Error during login:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Login failed',
      };
    }
  },

  async listUsers(): Promise<{ users: User[] }> {
    try {
      const usersJson = await AsyncStorage.getItem(USERS_KEY);
      return { users: usersJson ? JSON.parse(usersJson) : [] };
    } catch (error) {
      console.error('Error listing users:', error);
      return { users: [] };
    }
  },

  async getCurrentUser(): Promise<Omit<User, 'passwordHash'> | null> {
    try {
      const userJson = await AsyncStorage.getItem(CURRENT_USER_KEY);
      return userJson ? JSON.parse(userJson) : null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },

  async logout(): Promise<void> {
    try {
      await AsyncStorage.removeItem(CURRENT_USER_KEY);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  },

  async deleteUser(email: string): Promise<{ success: boolean; message: string }> {
    try {
      const usersJson = await AsyncStorage.getItem(USERS_KEY);
      const users: User[] = usersJson ? JSON.parse(usersJson) : [];
      
      const filteredUsers = users.filter(
        user => user.email.toLowerCase() !== email.toLowerCase()
      );
      
      if (filteredUsers.length === users.length) {
        return {
          success: false,
          message: `User with email "${email}" not found`
        };
      }

      await AsyncStorage.setItem(USERS_KEY, JSON.stringify(filteredUsers));
      
      return {
        success: true,
        message: `Successfully deleted user with email "${email}"`
      };
    } catch (error) {
      console.error('Error deleting user:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete user'
      };
    }
  }
}; 
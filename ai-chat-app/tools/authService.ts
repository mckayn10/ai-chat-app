interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  updatedAt: string;
}

interface AuthResponse {
  user: User;
  token: string;
}

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export const authService = {
  async register(email: string, firstName: string, lastName: string, password: string): Promise<AuthResponse> {
    console.log('Registering with API URL:', API_URL);
    const response = await fetch(`${API_URL}/users/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        firstName,
        lastName,
        password,
      }),
    });

    const data = await response.json();
    console.log('Register response:', { status: response.status, data });

    if (!response.ok) {
      throw new Error(data.error || 'Failed to register');
    }

    return data;
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    console.log('Logging in with API URL:', API_URL);
    const response = await fetch(`${API_URL}/users/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const data = await response.json();
    console.log('Login response:', { status: response.status, data });

    if (!response.ok) {
      throw new Error(data.error || 'Failed to login');
    }

    return data;
  },

  async getCurrentUser(token: string): Promise<User> {
    console.log('Getting current user with token:', token?.substring(0, 10) + '...');
    const response = await fetch(`${API_URL}/users/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();
    console.log('Get current user response:', { status: response.status, data });

    if (!response.ok) {
      throw new Error(data.error || 'Failed to get user data');
    }

    return data;
  },
}; 
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  phone: string;
  address: string;
  profileImage: string | null;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  phone: string;
  address: string;
  profileImage: string | null;
  role: 'customer' | 'admin';
  createdAt: string;
  updatedAt: string;
}

export class UserAPI {
  static async registerUser(data: RegisterInput): Promise<User> {
    const response = await fetch(`${API_URL}/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to register user');
    }

    return response.json();
  }

  static async loginUser(email: string, password: string): Promise<User> {
    const response = await fetch(`${API_URL}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to log in');
    }

    return response.json();
  }
}

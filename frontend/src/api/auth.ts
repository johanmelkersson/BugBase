import client from './client';

export interface AuthResponse {
  token: string;
  username: string;
  role: string;
  email: string;
  currentProjectId: number | null;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const response = await client.post('/api/auth/login', { email, password });
  return response.data;
}

export async function register(username: string, email: string, password: string): Promise<AuthResponse> {
  const response = await client.post('/api/auth/register', { username, email, password });
  return response.data;
}
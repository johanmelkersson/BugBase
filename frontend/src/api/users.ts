import client from './client';
import type { User, UserSearchResult } from '../types';

export async function getUsers(): Promise<User[]> {
    const response = await client.get('/api/user');
    return response.data;
}

export async function updateUserRole(id: number, role: string): Promise<User> {
    const response = await client.put(`/api/user/${id}`, { role });
    return response.data;
}

export async function searchUsers(username: string): Promise<UserSearchResult[]> {
  const response = await client.get('/api/user/search', { params: { username } });
  return response.data;
}

export async function updateProfile(data: { username?: string; email?: string; password?: string; role?: string; currentPassword?: string; color?: string }) {
    const response = await client.put('/api/user/profile', data);
    return response.data;
}

export async function deleteAccount(): Promise<void> {
    await client.delete('/api/user/profile');
}

export async function deleteUser(id: number): Promise<void> {
    await client.delete(`/api/user/${id}`);
}

export async function setCurrentProject(projectId: number | null): Promise<void> {
    await client.put('/api/user/current-project', { projectId });
}

export async function getMe(): Promise<{ token: string; username: string; role: string; email: string; currentProjectId: number | null; color: string }> {
    const response = await client.get('/api/user/me');
    return response.data;
}
import client from './client';
import type { User } from '../types';

export async function getUsers(): Promise<User[]> {
    const response = await client.get('/api/user');
    return response.data;
}

export async function updateUserRole(id: number, role: string): Promise<User> {
    const response = await client.put(`/api/user/${id}`, { role });
    return response.data;
}
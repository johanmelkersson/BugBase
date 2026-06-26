import client from './client';
import type { Notification } from '../types';

export async function getUnread(): Promise<Notification[]> {
    const response = await client.get('/api/notification');
    return response.data;
}

export async function markRead(id: number): Promise<void> {
    await client.put(`/api/notification/${id}/read`);
}

export async function markAllRead(): Promise<void> {
    await client.put('/api/notification/read-all');
}

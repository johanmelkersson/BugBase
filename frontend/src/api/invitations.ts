import client from './client';
import type { Invitation } from '../types';

export const getPending = async (): Promise<Invitation[]> => {
  const res = await client.get('/api/invitation/pending');
  return res.data;
};

export const acceptInvitation = async (id: number): Promise<void> => {
  await client.put(`/api/invitation/${id}/accept`);
};

export const declineInvitation = async (id: number): Promise<void> => {
  await client.put(`/api/invitation/${id}/decline`);
};

export const sendInvitation = async (projectId: number, invitedUserId: number, role: string): Promise<void> => {
  await client.post('/api/invitation', { projectId, invitedUserId, role });
};

export const getPendingUserIds = async (projectId: number): Promise<number[]> => {
  const res = await client.get(`/api/invitation/project/${projectId}/pending-users`);
  return res.data;
};
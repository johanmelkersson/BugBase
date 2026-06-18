
import client from './client';
import type { Comment, UpdateComment } from '../types';

export async function getAll(issueId: number): Promise<Comment[]> {
    const response = await client.get('/api/comment', { params: { issueId } });
    return response.data;
}

export async function create(issueId: number, content: string): Promise<Comment> {
    const response = await client.post('/api/comment', { issueId, content });
    return response.data;
}

export async function update(id: number, data: UpdateComment): Promise<Comment> {
    const response = await client.put(`/api/comment/${id}`, data);
    return response.data;
}

export async function deleteComment(id: number): Promise<void> {
    await client.delete(`/api/comment/${id}`);
}
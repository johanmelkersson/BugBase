import client from './client';
import type { Issue, IssueDetail, UpdateIssue } from '../types';

export async function getAll(projectId: number): Promise<Issue[]> {
    const response = await client.get('/api/issue', { params: { projectId } });
    return response.data;
}

export async function getById(id: number): Promise<Issue> {
    const response = await client.get(`/api/issue/${id}`);
    return response.data;
}

export async function getDetail(id: number): Promise<IssueDetail> {
    const response = await client.get(`/api/issue/${id}`);
    return response.data;
}

export async function create(projectId: number, title: string, description: string, priority: string, status: string, assignedTo?: number): Promise<Issue> {
    const response = await client.post('/api/issue', { projectId, title, description, priority, status, assignedTo });
    return response.data;
}

export async function update(id: number, data: UpdateIssue): Promise<Issue> {
    const response = await client.put(`/api/issue/${id}`, data);
    return response.data;
}

export async function deleteIssue(id: number): Promise<void> {
    await client.delete(`/api/issue/${id}`);
}
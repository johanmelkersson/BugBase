import client from './client';
import type { Project, ProjectMember } from '../types';

export async function getProjects(): Promise<Project[]> {
    const response = await client.get('/api/project');
    return response.data;
}

export async function getAllProjectsAdmin(): Promise<Project[]> {
    const response = await client.get('/api/project/admin/all');
    return response.data;
}

export async function create(name: string, description: string): Promise<Project> {
    const response = await client.post('/api/project', { name, description });
    return response.data;
}

export async function leaveProject(id: number): Promise<void> {
    await client.delete(`/api/project/${id}/leave`);
}

export async function deleteProject(id: number): Promise<void> {
    await client.delete(`/api/project/${id}`);
}

export async function updateProject(id: number, name: string, description: string): Promise<Project> {
    const response = await client.put(`/api/project/${id}`, { name, description });
    return response.data;
}

export async function getMembers(projectId: number): Promise<ProjectMember[]> {
    const response = await client.get(`/api/project/${projectId}/members`);
    return response.data;
}

export async function removeMember(projectId: number, userId: number): Promise<void> {
    await client.delete(`/api/project/${projectId}/members/${userId}`);
}

export async function updateMemberRole(projectId: number, userId: number, role: string): Promise<void> {
    await client.put(`/api/project/${projectId}/members/${userId}`, { role });
}
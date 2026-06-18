import client from './client';
import type { Project } from '../types';

export async function getAll(): Promise<Project[]> {
    const response = await client.get('/api/project');
    return response.data;
}

export async function create(name: string, description: string): Promise<Project> {
    const response = await client.post('/api/project', { name, description });
    return response.data;
}
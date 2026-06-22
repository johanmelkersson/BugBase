import type { Project, User } from '../types';
import { useEffect, useState } from 'react';
import { getUsers, updateUserRole } from '../api/users';
import { getProjects, deleteProject } from '../api/projects';



export default function AdminPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [users, setUsers] = useState<User[]>([]);

    useEffect(() => {
        async function fetchIssue() {
            const [users, projects] = await Promise.all([
                getUsers(),
                getProjects()
            ]);
            setUsers(users);
            setProjects(projects);
        }
        fetchIssue();
    }, []);

    async function handleRoleChange(id: number, newRole: string) {
        const updated = await updateUserRole(id, newRole);
        setUsers(prev => prev.map(u => u.id === id ? updated : u));
    }

    async function handleDelete(id: number) {
        await deleteProject(id);
        setProjects(prev => prev.filter(p => p.id !== id))
    }

    return (
        <div>
            <h1>Projekt</h1>
            {projects.map(project => (
                <div key={project.id}>
                    <h2>{project.name}</h2>
                    <p>{project.description}</p>
                    <p>Created by: {project.createdBy}</p>
                    <p>Date: {new Date(project.createdAt).toLocaleDateString()}</p>
                    <button onClick={() => handleDelete(project.id)} type="button">Delete project</button>
                </div>
            ))}
            <h1>Användare</h1>
            {users.map(user => (
                <div key={user.id}>
                    <p>{user.username} — {user.email}</p>
                    <select value={user.role} onChange={r => handleRoleChange(user.id, r.target.value)}>
                        <option value="Admin">Admin</option>
                        <option value="Developer">Developer</option>
                        <option value="Reporter">Reporter</option>
                    </select>
                </div>
            ))}
        </div >
    );
}
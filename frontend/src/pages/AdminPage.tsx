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
        <div className="flex flex-col gap-10">

            {/* Projects */}
            <div>
                <h1 className="text-2xl font-semibold text-white mb-4">Projekt</h1>
                <div className="flex flex-col gap-2">
                    {projects.map(project => (
                        <div key={project.id} className="bg-[#1e1f27] border border-gray-700 rounded-xl px-5 py-4 flex items-center justify-between gap-4">
                            <div className="flex-1 min-w-0">
                                <p className="text-white text-sm font-medium truncate">{project.name}</p>
                                <p className="text-gray-500 text-xs mt-0.5 truncate">{project.description}</p>
                            </div>
                            <div className="flex items-center gap-4 shrink-0 text-xs text-gray-500">
                                <span>{project.createdBy}</span>
                                <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                                <button
                                    onClick={() => handleDelete(project.id)}
                                    type="button"
                                    className="text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-400/50 rounded-lg px-3 py-1.5 transition-colors"
                                >
                                    Ta bort
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Users */}
            <div>
                <h1 className="text-2xl font-semibold text-white mb-4">Användare</h1>
                <div className="flex flex-col gap-2">
                    {users.map(user => (
                        <div key={user.id} className="bg-[#1e1f27] border border-gray-700 rounded-xl px-5 py-4 flex items-center justify-between gap-4">
                            <div>
                                <p className="text-white text-sm font-medium">{user.username}</p>
                                <p className="text-gray-500 text-xs mt-0.5">{user.email}</p>
                            </div>
                            <select
                                value={user.role}
                                onChange={r => handleRoleChange(user.id, r.target.value)}
                                className="bg-[#13141a] border border-gray-700 text-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                            >
                                <option value="Admin">Admin</option>
                                <option value="Developer">Developer</option>
                                <option value="Reporter">Reporter</option>
                            </select>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
}
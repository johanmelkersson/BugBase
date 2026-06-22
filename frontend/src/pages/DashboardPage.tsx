import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getProjects } from '../api/projects';
import type { Project } from '../types';

export default function DashboardPage() {
    const [projects, setProjects] = useState<Project[]>([]);

    useEffect(() => {
        getProjects().then(projects => setProjects(projects));
    }, []);

    return (
        <div>
            <h1 className="text-2xl font-semibold text-white mb-6">Projekt</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map(project => (
                    <Link
                        key={project.id}
                        to={`/projects/${project.id}`}
                        className="bg-[#1e1f27] border border-gray-700 rounded-xl p-5 hover:border-indigo-500 transition-colors group"
                    >
                        <h2 className="text-white font-medium text-base group-hover:text-indigo-400 transition-colors mb-1">
                            {project.name}
                        </h2>
                        <p className="text-gray-400 text-sm mb-4 line-clamp-2">{project.description}</p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>{project.createdBy}</span>
                            <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
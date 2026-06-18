import { useEffect, useState } from 'react';
import { getAll } from '../api/projects';
import type { Project } from '../types';
import { Link } from 'react-router-dom';

export default function DashboardPage() {
    const [projects, setProjects] = useState<Project[]>([]);

    useEffect(() => {
        getAll().then(projects => setProjects(projects));
    }, []);

    return (
        <div>
        <h1>Projekt</h1>
        {projects.map(project => (
            <div key={project.id}>     
            <Link to={`/projects/${project.id}`}>
              <h2>{project.name}</h2>
            </Link>
            <p>{project.description}</p>
            <p>Created by: {project.createdBy}</p>
            <p>Date: {new Date(project.createdAt).toLocaleDateString()}</p>
            </div>
        ))}
        </div>
    );
}